require('dotenv').config();
const express = require('express');
const cors = require('cors');
const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
    optionsSuccessStatus: 200
};
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('../config/swagger.config');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const educationRoutes = require('./routes/education.routes');
const adminRoutes = require('./routes/admin.routes');
const reportsRoutes = require('./routes/reports.routes');
const questionsRoutes = require('./routes/questions.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use(express.json());
app.use(morgan('dev'));

// Database connection and service initialization
async function initializeApp() {
    try {
        await connectDB();
        
        // Initialize controllers
        const examController = require('./controllers/exam.controller');
        await examController.initialize();
        
        // Initialize routes
        app.use('/auth', authRoutes);
        app.use('/api/education', educationRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/reports', reportsRoutes);
        app.use('/api/questions', questionsRoutes);
        app.use('/api/students', studentRoutes);
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        
        // Error handling middleware (moved here to be registered before server start)
        app.use((err, req, res, next) => {
            console.error('Unhandled error:', err.stack || err);
            res.status(500).json({
                success: false,
                message: err.message || 'Something went wrong!'
            });
        });

        // Start server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
        }).on('error', (err) => {
            // Catch EADDRINUSE errors specifically from app.listen
            if (err.code === 'EADDRINUSE') {
                console.error(`Error: Port ${PORT} is already in use. Please ensure no other service is running on this port.`);
            } else {
                console.error('Server failed to start:', err);
            }
            process.exit(1); // Exit if server can't start
        });
    } catch (error) {
        console.error('Error initializing application:', error);
        process.exit(1);
    }
}

initializeApp();

// Error handling middleware (should be placed after routes and before server start, or at the end if server start is within a function)
// For now, let's ensure it's registered before the server starts within initializeApp or just once globally.
// Moving it into initializeApp before app.listen is a common pattern.

// The initializeApp() call will handle server start and all route registrations.
// The global error handler can be defined here and used by app if app is in scope,
// or defined and used within initializeApp.
