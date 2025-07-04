const ApiError = require('../utils/api-error');

// Validación de datos para la creación de estudiantes
const validateStudent = (req, res, next) => {
    try {
        const { name, lastName, email, dateOfBirth } = req.body;

        if (!name || typeof name !== 'string') {
            return next(new ApiError(400, 'El nombre es requerido y debe ser una cadena'));
        }

        if (!lastName || typeof lastName !== 'string') {
            return next(new ApiError(400, 'El apellido es requerido y debe ser una cadena'));
        }

        if (!email || typeof email !== 'string') {
            return next(new ApiError(400, 'El email es requerido y debe ser una cadena'));
        }

        if (!dateOfBirth) {
            return next(new ApiError(400, 'La fecha de nacimiento es requerida'));
        }

        // Validación básica de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError(400, 'El formato del email no es válido'));
        }

        // Validación de formato de fecha
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
            return next(new ApiError(400, 'El formato de la fecha de nacimiento no es válido. Use YYYY-MM-DD'));
        }

        // Validar que la fecha no sea futura
        if (date > new Date()) {
            return next(new ApiError(400, 'La fecha de nacimiento no puede ser futura'));
        }

        next();
    } catch (error) {
        console.error('Error en validación:', error);
        return next(new ApiError(400, 'Formato de datos inválido'));
    }
};

module.exports = {
    validateStudent
};
