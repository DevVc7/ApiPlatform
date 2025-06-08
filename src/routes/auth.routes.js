const express = require('express');
const router = express.Router();
const { login, refreshToken, logout } = require('../controllers/auth.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     CredencialesLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario.
 *       example:
 *         email: usuario@example.com
 *         password: "tuContraseñaSegura123"
 *     RespuestaToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Token de acceso JWT.
 *         refreshToken:
 *           type: string
 *           description: Token de refresco.
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             role:
 *               type: string
 *       example:
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user: 
 *           id: "123e4567-e89b-12d3-a456-426614174000"
 *           name: "Nombre Usuario"
 *           email: "usuario@example.com"
 *           role: "student"
 *     SolicitudRefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de refresco para obtener un nuevo token de acceso.
 *       example:
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     ErrorGenerico:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensaje de error.
 *       example:
 *         message: "Error en la solicitud"
 *   securitySchemes:
 *     bearerAuth: # Ya debería estar definido globalmente en swagger.config.js, pero es bueno tenerlo como referencia.
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Operaciones relacionadas con la autenticación de usuarios
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CredencialesLogin'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, devuelve tokens y datos del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaToken'
 *       400:
 *         description: Datos de entrada inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       401:
 *         description: Credenciales incorrectas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SolicitudRefreshToken'
 *     responses:
 *       200:
 *         description: Token de acceso refrescado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Nuevo token de acceso JWT.
 *               example:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Token de refresco inválido o faltante.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       401:
 *         description: Token de refresco no válido o expirado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión de usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: [] # Indica que esta ruta requiere autenticación JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: El token de refresco que se invalidará.
 *             required:
 *               - refreshToken
 *             example:
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Sesión cerrada exitosamente"
 *       400:
 *         description: Token de refresco faltante.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       401:
 *         description: No autorizado (token de acceso inválido o ausente).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGenerico'
 */
router.post('/logout', logout);

module.exports = router;
