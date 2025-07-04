const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar el campo updatedAt
studentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
