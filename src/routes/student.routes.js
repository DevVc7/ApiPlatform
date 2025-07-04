/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - name
 *         - lastName
 *         - email
 *         - dateOfBirth
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del estudiante
 *         name:
 *           type: string
 *           description: Nombre del estudiante
 *         lastName:
 *           type: string
 *           description: Apellido del estudiante
 *         email:
 *           type: string
 *           description: Email del estudiante
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento del estudiante
 *         phoneNumber:
 *           type: string
 *           description: Número de teléfono del estudiante
 *         address:
 *           type: string
 *           description: Dirección del estudiante
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: 1
 *         name: Juan
 *         lastName: Pérez
 *         email: juan.perez@example.com
 *         dateOfBirth: 2000-01-01
 *         phoneNumber: 555-1234
 *         address: Calle Falsa 123
 *         createdAt: 2025-06-24T14:37:35.000Z
 *         updatedAt: 2025-06-24T14:37:35.000Z
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { validateStudent } = require('../middleware/validation.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Crear un nuevo estudiante
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Estudiante creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', auth, authorize(['manage_students']), validateStudent, studentController.createStudent);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Obtener todos los estudiantes
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', auth, authorize(['view_students']), studentController.getAllStudents);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Obtener un estudiante por ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estudiante
 *     responses:
 *       200:
 *         description: Estudiante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', auth, authorize(['view_students']), studentController.getStudentById);

module.exports = router;
