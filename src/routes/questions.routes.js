const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { 
    createQuestion, 
    getQuestion, 
    getAdaptiveQuestion, 
    checkAnswer, 
    getBadges, 
    getClassRanking 
} = require('../controllers/questions.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionInput: # Asumiendo que ya tienes un schema Question definido en education.routes.js o globalmente
 *       $ref: '#/components/schemas/Question' # Referencia al schema global si existe
 *     QuestionResponse:
 *       $ref: '#/components/schemas/Question'
 *     AdaptiveQuestionParams:
 *       type: object
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *           description: ID del estudiante.
 *         topic:
 *           type: string
 *           description: Tema para la pregunta adaptativa.
 *     AnswerCheckInput:
 *       type: object
 *       required:
 *         - questionId
 *         - answer
 *         - studentId
 *       properties:
 *         questionId:
 *           type: string
 *           format: uuid
 *           description: ID de la pregunta.
 *         answer:
 *           type: string # O el tipo que corresponda a la respuesta
 *           description: Respuesta proporcionada por el estudiante.
 *         studentId:
 *           type: string
 *           format: uuid
 *           description: ID del estudiante.
 *     AnswerCheckResponse:
 *       type: object
 *       properties:
 *         isCorrect:
 *           type: boolean
 *         correctAnswer:
 *           type: string # O el tipo que corresponda
 *         explanation:
 *           type: string
 *           nullable: true
 *     BadgeResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         iconUrl:
 *           type: string
 *           format: url
 *     RankingEntry:
 *       type: object
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *         studentName:
 *           type: string
 *         score:
 *           type: number
 *         rank:
 *           type: integer
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Preguntas
 *     description: Gestión de preguntas y funcionalidades adaptativas.
 *   - name: Gamificación
 *     description: Operaciones relacionadas con insignias y rankings.
 */

// Rutas protegidas para administradores (gestión de preguntas)
/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Crear una nueva pregunta (similar a /api/education/questions)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput' # Reutiliza el schema de Question
 *     responses:
 *       201:
 *         description: Pregunta creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/', auth, createQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Obtener una pregunta por su ID
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la pregunta.
 *     responses:
 *       200:
 *         description: Detalles de la pregunta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       404:
 *         description: Pregunta no encontrada.
 */
router.get('/:id', auth, getQuestion);

// Rutas para estudiantes (preguntas adaptativas)
/**
 * @swagger
 * /api/questions/adaptive/{studentId}/{topic}:
 *   get:
 *     summary: Obtener una pregunta adaptativa para un estudiante y tema
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del estudiante.
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: Tema para la pregunta adaptativa.
 *     responses:
 *       200:
 *         description: Pregunta adaptativa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionResponse'
 *       404:
 *         description: No se encontraron preguntas adecuadas.
 */
router.get('/adaptive/:studentId/:topic', auth, getAdaptiveQuestion);

/**
 * @swagger
 * /api/questions/check-answer:
 *   post:
 *     summary: Verificar la respuesta de un estudiante a una pregunta
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnswerCheckInput'
 *     responses:
 *       200:
 *         description: Resultado de la verificación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnswerCheckResponse'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/check-answer', auth, checkAnswer);

// Rutas de gamificación
/**
 * @swagger
 * /api/questions/badges/{studentId}:
 *   get:
 *     summary: Obtener las insignias de un estudiante
 *     tags: [Gamificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del estudiante.
 *     responses:
 *       200:
 *         description: Lista de insignias del estudiante.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BadgeResponse'
 */
router.get('/badges/:studentId', auth, getBadges);

/**
 * @swagger
 * /api/questions/ranking/class/{grade}:
 *   get:
 *     summary: Obtener el ranking de una clase/grado
 *     tags: [Gamificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         schema:
 *           type: string # o integer, según corresponda
 *         description: Grado o clase para el ranking.
 *     responses:
 *       200:
 *         description: Ranking de la clase.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RankingEntry'
 */
router.get('/ranking/class/:grade', auth, getClassRanking);

module.exports = router;
