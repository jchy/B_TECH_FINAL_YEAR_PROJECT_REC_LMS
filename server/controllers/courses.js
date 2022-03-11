import express from 'express';
import mongoose from 'mongoose';

import Course from '../models/courseDescription.js';

const router = express.Router();

export const getCourses = async (req, res) => {
    const { page } = req.query;
    
    try {
        const LIMIT = 4;
        const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
        const total = await Course.countDocuments({});
        const courses = await Course.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

        res.json({ data: courses, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT)});
    } catch (error) {    
        res.status(404).json({ message: error.message });
    }
}

export const getCoursesBySearch = async (req, res) => {
    const { searchQuery, tags } = req.query;

    try {
        const title = new RegExp(searchQuery, "i");

        const courses = await Course.find({ $or: [ { title }, { tags: { $in: tags.split(',') } } ]});

        res.json({ data: courses });
    } catch (error) {    
        res.status(404).json({ message: error.message });
    }
}

export const getCoursesByCreator = async (req, res) => {
    const { name } = req.query;

    try {
        const courses = await Course.find({ name });

        res.json({ data: courses });
    } catch (error) {    
        res.status(404).json({ message: error.message });
    }
}

export const getCourse = async (req, res) => { 
    const { id } = req.params;

    try {
        const course = await Course.findById(id);
        
        res.status(200).json(course);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createCourse = async (req, res) => {
    const course = req.body;

    const newCourse = new Course({ ...course, creator: req.userId, createdAt: new Date().toISOString() })

    try {
        await newCourse.save();

        res.status(201).json(newCourse);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, creator, selectedFile, tags } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No course with id: ${id}`);

    const updatedCourse = { creator, title, description, price, tags, selectedFile, _id: id };

    await Course.findByIdAndUpdate(id, updatedCourse, { new: true });

    res.json(updatedCourse);
}

export const deleteCourse = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No course with id: ${id}`);

    await Course.findByIdAndRemove(id);

    res.json({ message: "Course is deleted successfully." });
}

export const likeCourse = async (req, res) => {
    const { id } = req.params;

    if (!req.userId) {
        return res.json({ message: "Unauthenticated" });
      }

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No course with id: ${id}`);
    
    const course = await Course.findById(id);

    const index = course.likes.findIndex((id) => id ===String(req.userId));

    if (index === -1) {
        course.likes.push(req.userId);
    } else {
        course.likes = course.likes.filter((id) => id !== String(req.userId));
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, course, { new: true });

    res.status(200).json(updatedCourse);
}

export const commentCourse = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;

    const course = await Course.findById(id);

    course.comments.push(value);

    const updatedCourse = await Course.findByIdAndUpdate(id, course, { new: true });

    res.json(updatedCourse);
};

export default router;