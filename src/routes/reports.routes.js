const express = require('express');
const router = express.Router();
const { auth, authSuperAdmin } = require('../middleware/auth.middleware'); // Asumiendo que authSuperAdmin podría ser necesario o auth con roles específicos
const { 
    generateAdminReport, 
    getAuditLogs 
} = require('../controllers/reports.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminReportResponse:
 *       type: object
 *       properties:
 *         reportUrl:
 *           type: string
 *           format: url
 *           description: URL al reporte generado (ej. PDF, CSV).
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de generación del reporte.
 *         filtersApplied:
 *           type: object
 *           description: Filtros que se aplicaron para generar el reporte.
 *     AuditLogEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         timestamp:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         action:
 *           type: string
 *           description: Acción realizada (ej. LOGIN, CREATE_EXAM, DELETE_USER).
 *         entity:
 *           type: string
 *           nullable: true
 *           description: Entidad afectada (ej. User, Exam, Question).
 *         entityId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         details:
 *           type: object
 *           additionalProperties: true
 *           description: Detalles adicionales de la acción.
 *         ipAddress:
 *           type: string
 *           nullable: true
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Generación de reportes y acceso a registros de auditoría.
 */

// Rutas protegidas para generar reportes
/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Generar un reporte administrativo
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: [] # Asumir que requiere al menos autenticación, idealmente un rol específico
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [user_activity, exam_completion, system_health]
 *         required: true
 *         description: Tipo de reporte a generar.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para el reporte (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para el reporte (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReportResponse'
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *             description: El reporte en formato PDF (si aplica).
 *       400:
 *         description: Parámetros de consulta inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (rol no permitido).
 */
router.get('/admin', auth, generateAdminReport); // Considerar authSuperAdmin o un rol específico si es necesario

/**
 * @swagger
 * /api/reports/audit-logs:
 *   get:
 *     summary: Obtener registros de auditoría del sistema
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: [] # Asumir que requiere al menos autenticación, idealmente SuperAdmin
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de registros por página.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de usuario.
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de acción.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar por fecha de inicio.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar por fecha de fin.
 *     responses:
 *       200:
 *         description: Lista paginada de registros de auditoría.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLogEntry'
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Prohibido (rol no permitido).
 */
router.get('/audit-logs', auth, getAuditLogs); // Considerar authSuperAdmin si es necesario

module.exports = router;
