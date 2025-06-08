const express = require('express');
const router = express.Router();
const { auth, authSuperAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminUserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del administrador.
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del administrador.
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña para el nuevo administrador.
 *     AdminUserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nuevo nombre del administrador.
 *         email:
 *           type: string
 *           format: email
 *           description: Nuevo correo electrónico del administrador.
 *         password:
 *           type: string
 *           format: password
 *           description: Nueva contraseña para el administrador (opcional).
 *     AdminUserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ExamTemplateInput:
 *       type: object
 *       required:
 *         - name
 *         - subject_id
 *         - questions_per_subcategory
 *       properties:
 *         name:
 *           type: string
 *         subject_id:
 *           type: string
 *           format: uuid
 *         questions_per_subcategory:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *     ExamScheduleInput:
 *       type: object
 *       required:
 *         - exam_id
 *         - group_id
 *         - start_time
 *         - end_time
 *       properties:
 *         exam_id:
 *           type: string
 *           format: uuid
 *         group_id:
 *           type: string
 *           format: uuid
 *         start_time:
 *           type: string
 *           format: date-time
 *         end_time:
 *           type: string
 *           format: date-time
 *     GroupInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *     AssignStudentsInput:
 *       type: object
 *       required:
 *         - student_ids
 *       properties:
 *         student_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Administración
 *   description: Operaciones de administración (requiere rol SuperAdmin)
 */

// Rutas protegidas para SuperAdmin
/**
 * @swagger
 * /api/admin:
 *   get:
 *     summary: Obtener lista de administradores
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de administradores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminUserResponse'
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (no es SuperAdmin).
 */
router.get('/', auth, authSuperAdmin, adminController.getAdmins);

/**
 * @swagger
 * /api/admin:
 *   post:
 *     summary: Crear un nuevo administrador
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserInput'
 *     responses:
 *       201:
 *         description: Administrador creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUserResponse'
 *       400:
 *         description: Datos inválidos.
 */
router.post('/', auth, authSuperAdmin, adminController.createAdmin);

/**
 * @swagger
 * /api/admin/{id}:
 *   put:
 *     summary: Actualizar un administrador existente
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del administrador a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserUpdateInput'
 *     responses:
 *       200:
 *         description: Administrador actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUserResponse'
 *       404:
 *         description: Administrador no encontrado.
 */
router.put('/:id', auth, authSuperAdmin, adminController.updateAdmin);

/**
 * @swagger
 * /api/admin/{id}:
 *   delete:
 *     summary: Eliminar un administrador
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del administrador a eliminar.
 *     responses:
 *       204:
 *         description: Administrador eliminado.
 *       404:
 *         description: Administrador no encontrado.
 */
router.delete('/:id', auth, authSuperAdmin, adminController.deleteAdmin);

// Rutas de administración de exámenes
/**
 * @swagger
 * /api/admin/templates:
 *   post:
 *     summary: Crear una plantilla de examen
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamTemplateInput'
 *     responses:
 *       201:
 *         description: Plantilla creada.
 */
router.post('/templates', auth, authSuperAdmin, adminController.createTemplate);

/**
 * @swagger
 * /api/admin/templates/{templateId}/exams:
 *   post:
 *     summary: Generar un examen a partir de una plantilla
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla de examen.
 *     responses:
 *       201:
 *         description: Examen generado.
 */
router.post('/templates/:templateId/exams', auth, authSuperAdmin, adminController.generateExam);

/**
 * @swagger
 * /api/admin/exams/schedule:
 *   post:
 *     summary: Programar un examen para un grupo
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamScheduleInput'
 *     responses:
 *       200:
 *         description: Examen programado.
 */
router.post('/exams/schedule', auth, authSuperAdmin, adminController.scheduleExam);

// Rutas de grupos y estudiantes
/**
 * @swagger
 * /api/admin/groups:
 *   post:
 *     summary: Crear un nuevo grupo
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupInput'
 *     responses:
 *       201:
 *         description: Grupo creado.
 */
router.post('/groups', auth, authSuperAdmin, adminController.createGroup);

/**
 * @swagger
 * /api/admin/groups/{groupId}/students:
 *   post:
 *     summary: Asignar estudiantes a un grupo
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del grupo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignStudentsInput'
 *     responses:
 *       200:
 *         description: Estudiantes asignados.
 */
router.post('/groups/:groupId/students', auth, authSuperAdmin, adminController.assignStudents);

// Rutas de dashboard
/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard para SuperAdmin
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Definir el esquema de respuesta de estadísticas aquí
 */
router.get('/dashboard/stats', auth, authSuperAdmin, adminController.getDashboardStats);

module.exports = router;
