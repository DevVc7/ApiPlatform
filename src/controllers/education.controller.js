const { sql } = require('../config/db');

exports.getCourses = async (req, res) => {
    try {
        const courses = await sql.query`
            SELECT * FROM courses
            ORDER BY created_at DESC
        `;
        
        res.json({
            success: true,
            data: courses.recordset
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await sql.query`
            SELECT * FROM courses 
            WHERE id = ${id}
        `;
        
        if (course.recordset.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.json({
            success: true,
            data: course.recordset[0]
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, duration, category_id } = req.body;
        
        const result = await sql.query`
            INSERT INTO courses (title, description, price, duration, category_id, created_at)
            VALUES (${title}, ${description}, ${price}, ${duration}, ${category_id}, CURRENT_TIMESTAMP)
        `;
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { id: result.recordset[0].id }
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
