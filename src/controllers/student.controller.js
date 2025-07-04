const studentRepository = require('../repositories/student.repository');
const ApiError = require('../utils/api-error');

// Función para validar el formato de fecha
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

// Crear un nuevo estudiante
const createStudent = async (req, res, next) => {
    try {
        const { name, lastName, email, dateOfBirth, phoneNumber, address } = req.body;

        // Validación básica de campos requeridos
        if (!name || !lastName || !email || !dateOfBirth) {
            return next(new ApiError(400, 'Todos los campos requeridos deben estar presentes'));
        }

        // Validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError(400, 'El formato del email no es válido'));
        }

        // Validación de fecha
        if (!isValidDate(dateOfBirth)) {
            return next(new ApiError(400, 'La fecha de nacimiento no es válida'));
        }

        const studentData = {
            name,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            phoneNumber: phoneNumber || '',
            address: address || ''
        };

        const student = await studentRepository.createStudent(studentData);
        res.status(201).json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error detallado:', error);
        if (error.message.includes('duplicate key')) {
            return next(new ApiError(400, 'El email ya existe'));
        }
        next(new ApiError(500, error.message || 'Error al crear el estudiante'));
    }
};

// Obtener todos los estudiantes
const getAllStudents = async (req, res, next) => {
    try {
        const students = await studentRepository.getAllStudents();
        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        next(new ApiError(500, 'Error al obtener los estudiantes'));
    }
};

// Obtener un estudiante por ID
const getStudentById = async (req, res, next) => {
    try {
        try {
            const student = await studentRepository.getStudentById(req.params.id);
            if (!student) {
                return next(new ApiError(404, 'Estudiante no encontrado'));
            }
            res.status(200).json({
                success: true,
                data: student
            });
        } catch (error) {
            console.error('Error detallado en getStudentById:', error);
            if (error.message === 'ID inválido') {
                return next(new ApiError(400, 'ID inválido'));
            }
            next(new ApiError(500, 'Error al obtener el estudiante'));
        }
    } catch (error) {
        next(new ApiError(500, 'Error al obtener el estudiante'));
    }
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById
};
