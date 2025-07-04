const { executeQuery, getPool } = require('../config/db');

const createStudent = async (studentData) => {
    // Validación básica de datos
    if (!studentData || !studentData.name || !studentData.lastName || !studentData.email || !studentData.dateOfBirth) {
        throw new Error('Datos requeridos faltantes');
    }

    try {
        // Crear usuario
        const createUserQuery = `
            INSERT INTO Users (email, password, role, name, created_at, updated_at, mustChangePassword)
            VALUES (@email, @password, @role, @name, GETDATE(), GETDATE(), @mustChangePassword)
        `;
        
        // Usar una contraseña por defecto para estudiantes
        const defaultPassword = 'Student123!';
        
        await executeQuery(createUserQuery, {
            parameters: {
                email: studentData.email,
                password: defaultPassword, // En producción, esto debería estar hasheado
                role: 'student',
                name: `${studentData.name} ${studentData.lastName}`,
                mustChangePassword: true
            }
        });
        
        // Crear estudiante
        const createStudentQuery = `
            INSERT INTO Students (
                name,
                lastName,
                email,
                dateOfBirth,
                phoneNumber,
                address
            ) VALUES (
                @name,
                @lastName,
                @email,
                @dateOfBirth,
                @phoneNumber,
                @address
            )
            SELECT SCOPE_IDENTITY() as id;
        `;
        
        const result = await executeQuery(createStudentQuery, {
            parameters: {
                name: studentData.name,
                lastName: studentData.lastName,
                email: studentData.email,
                dateOfBirth: studentData.dateOfBirth,
                phoneNumber: studentData.phoneNumber,
                address: studentData.address
            }
        });
        
        if (!result || !result.recordset || result.recordset.length === 0) {
            throw new Error('No se pudo crear el estudiante');
        }
        
        return result.recordset[0];
    } catch (error) {
        console.error('Error detallado en createStudent:', error);
        throw new Error(`Error al ejecutar la consulta: ${error.message}`);
    }
};

const getAllStudents = async () => {
    const query = `
        SELECT 
            id,
            name,
            lastName,
            email,
            dateOfBirth,
            phoneNumber,
            address,
            createdAt,
            updatedAt
        FROM Students
    `;

    const result = await executeQuery(query);
    return result.recordset;
};

const getStudentById = async (id) => {
    try {
        // Validar que el ID sea un número
        const studentId = parseInt(id);
        if (isNaN(studentId)) {
            throw new Error('ID inválido');
        }

        const query = `
            SELECT 
                id,
                name,
                lastName,
                email,
                dateOfBirth,
                phoneNumber,
                address,
                createdAt,
                updatedAt
            FROM Students
            WHERE id = @id
        `;

        const result = await executeQuery(query, {
            parameters: {
                id: studentId
            }
        });

        if (!result || !result.recordset || result.recordset.length === 0) {
            return null;
        }

        return result.recordset[0];
    } catch (error) {
        console.error('Error en getStudentById:', error);
        throw new Error(`Error al obtener el estudiante: ${error.message}`);
    }
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById
};
