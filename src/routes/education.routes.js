/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Nombre de la materia
 *         description:
 *           type: string
 *           description: Descripción de la materia
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Question:
 *       type: object
 *       required:
 *         - subject_id
 *         - subcategory_id
 *         - type
 *         - content
 *         - correct_answer
 *         - points
 *         - difficulty
 *         - created_by
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         subject_id:
 *           type: string
 *           format: uuid
 *         subcategory_id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [multiple_choice, true_false, essay]
 *         content:
 *           type: string
 *           description: Contenido de la pregunta
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         correct_answer:
 *           type: string
 *         points:
 *           type: number
 *           format: decimal
 *         difficulty:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         created_by:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { ROLES } = require('../middleware/auth.middleware');
const examController = require('../controllers/exam.controller');
const evaluationController = require('../controllers/evaluation.controller');
const questionsController = require('../controllers/questions.controller');
const cacheService = require('../services/cache.service'); // Asumiendo que tienes un cacheService
const notificationService = require('../services/notification.service'); // Asumiendo que tienes un notificationService

/**
 * @swagger
 * tags:
 *   - name: Subjects
 *     description: Operaciones relacionadas con materias.
 *   - name: Questions
 *     description: Operaciones relacionadas con preguntas.
 *   - name: Exams
 *     description: Operaciones relacionadas con exámenes.
 *   - name: Evaluations
 *     description: Operaciones relacionadas con evaluaciones de exámenes.
 *   - name: Student Analytics
 *     description: Analíticas de rendimiento y patrones de aprendizaje de estudiantes.
 *   - name: System Utilities
 *     description: Utilidades del sistema como caché y notificaciones.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Nombre de la materia
 *         description:
 *           type: string
 *           description: Descripción de la materia
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Question:
 *       type: object
 *       required:
 *         - subject_id
 *         - subcategory_id
 *         - type
 *         - content
 *         - correct_answer
 *         - points
 *         - difficulty
 *         - created_by
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         subject_id:
 *           type: string
 *           format: uuid
 *         subcategory_id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [multiple_choice, true_false, essay]
 *         content:
 *           type: string
 *           description: Contenido de la pregunta
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         correct_answer:
 *           type: string
 *         points:
 *           type: number
 *           format: decimal
 *         difficulty:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         created_by:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ExamCreationInput:
 *       type: object
 *       required:
 *         - name
 *         - subject_id
 *         - question_ids
 *       properties:
 *         name:
 *           type: string
 *         subject_id:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *           nullable: true
 *         question_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         duration_minutes:
 *           type: integer
 *           nullable: true
 *     ExamResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         subject_id:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *         created_by:
 *            type: string
 *            format: uuid
 *         createdAt:
 *            type: string
 *            format: date-time
 *     ExamSessionResponse:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           format: uuid
 *         examId:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [not_started, in_progress, paused, submitted, graded]
 *         startTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         remainingTimeSeconds:
 *           type: integer
 *           nullable: true
 *     ExamSubmissionInput:
 *       type: object
 *       properties:
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *               answer:
 *                 type: string # O un objeto más complejo si las respuestas son variadas
 *     EvaluationScoreResponse:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           format: uuid
 *         score:
 *           type: number
 *         maxScore:
 *           type: number
 *         percentage:
 *           type: number
 *         gradedAt:
 *           type: string
 *           format: date-time
 *     GaussianCurveInput:
 *       type: object
 *       properties:
 *         mean:
 *           type: number
 *         stddev:
 *           type: number
 *     QuestionReviewInput:
 *       type: object
 *       required:
 *         - sessionId
 *         - questionId
 *         - reason
 *       properties:
 *         sessionId:
 *           type: string
 *           format: uuid
 *         questionId:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *     GradeAppealInput:
 *       type: object
 *       required:
 *         - sessionId
 *         - reason
 *       properties:
 *         sessionId:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *     PerformanceAnalyticsResponse:
 *       type: object # Definir la estructura de la respuesta de analíticas
 *       properties:
 *         metricName:
 *           type: string
 *         value:
 *           type: string # O number, object, array según la métrica
 *     ImportQuestionsInput:
 *       type: object
 *       properties:
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question' # Asume que el formato de importación es un array de objetos Question
 *         # O podría ser para carga de archivos:
 *         # file:
 *         #   type: string
 *         #   format: binary
 *     SubjectStatsResponse:
 *       type: object
 *       properties:
 *         totalQuestions:
 *           type: integer
 *         averageDifficulty:
 *           type: number
 *         # ... otras estadísticas
 *     RandomExamResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Question'
 *     RecommendedQuestionsResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Question'
 *     AnswerCheckInput:
 *       type: object
 *       required:
 *         - questionId
 *         - answer
 *       properties:
 *         questionId:
 *           type: string
 *         answer:
 *           type: string # O el tipo de dato de la respuesta
 *     AnswerCheckResponse:
 *       type: object
 *       properties:
 *         isCorrect:
 *           type: boolean
 *         correctAnswer:
 *           type: string # O el tipo de dato
 *     NotificationInput:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *         type:
 *           type: string
 *           enum: [info, warning, error]
 *           default: info
 *         recipientId:
 *           type: string
 *           format: uuid
 *           nullable: true # Si es para un usuario específico
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/education/subjects:
 *   get:
 *     summary: Obtener todas las materias disponibles
 *     description: Lista todas las materias disponibles en el sistema
 *     security:
 *       - bearerAuth: []
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: Lista de materias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Token de autenticación inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/subjects', auth, examController.getAvailableSubjects);

/**
 * @swagger
 * /api/education/questions:
 *   post:
 *     summary: Crear una nueva pregunta
 *     description: Crea una nueva pregunta en el sistema
 *     security:
 *       - bearerAuth: []
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       201:
 *         description: Pregunta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Token de autenticación inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/questions', auth, questionsController.createQuestion);

/**
 * @swagger
 * /api/education/questions/{id}:
 *   get:
 *     summary: Obtener una pregunta específica por ID
 *     tags: [Questions]
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
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: Pregunta no encontrada.
 */
router.get('/questions/:id', auth, questionsController.getQuestion);

/**
 * @swagger
 * /api/education/questions/import:
 *   post:
 *     summary: Importar preguntas desde un archivo o estructura de datos
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json: # O multipart/form-data si es un archivo
 *           schema:
 *             $ref: '#/components/schemas/ImportQuestionsInput'
 *     responses:
 *       201:
 *         description: Preguntas importadas exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 importedCount:
 *                   type: integer
 *                 errorsCount:
 *                   type: integer
 *       400:
 *         description: Datos de importación inválidos.
 */
router.post('/questions/import', auth, questionsController.importQuestions);

/**
 * @swagger
 * /api/education/questions/search:
 *   get:
 *     summary: Buscar preguntas por criterios
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Palabra clave para buscar en el contenido de las preguntas.
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de materia.
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrar por dificultad.
 *     responses:
 *       200:
 *         description: Lista de preguntas encontradas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 */
router.get('/questions/search', auth, questionsController.searchQuestions);

/**
 * @swagger
 * /api/education/questions/stats:
 *   get:
 *     summary: Obtener estadísticas sobre las preguntas (ej. por materia)
 *     tags: [Questions, Student Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la materia para obtener estadísticas (opcional).
 *     responses:
 *       200:
 *         description: Estadísticas de las preguntas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectStatsResponse' # O un schema más genérico
 */
router.get('/questions/stats', auth, questionsController.getSubjectStatistics);

/**
 * @swagger
 * /api/education/questions/random-exam:
 *   get:
 *     summary: Generar un conjunto de preguntas aleatorias para un examen rápido
 *     tags: [Questions, Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la materia para las preguntas.
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de preguntas a generar.
 *     responses:
 *       200:
 *         description: Lista de preguntas aleatorias.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RandomExamResponse'
 */
router.get('/questions/random-exam', auth, questionsController.generateRandomExam);

/**
 * @swagger
 * /api/education/questions/recommendations:
 *   get:
 *     summary: Obtener preguntas recomendadas para un estudiante
 *     tags: [Questions, Student Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del estudiante para el cual generar recomendaciones.
 *     responses:
 *       200:
 *         description: Lista de preguntas recomendadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendedQuestionsResponse'
 */
router.get('/questions/recommendations', auth, questionsController.getRecommendedQuestions);

/**
 * @swagger
 * /api/education/questions/adaptive:
 *   get:
 *     summary: Obtener una pregunta adaptativa (basada en el rendimiento del estudiante)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del estudiante.
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la materia (opcional, para enfocar la adaptabilidad).
 *     responses:
 *       200:
 *         description: Pregunta adaptativa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: No se encontraron preguntas adaptativas adecuadas.
 */
router.get('/questions/adaptive', auth, questionsController.getAdaptiveQuestion);

/**
 * @swagger
 * /api/education/questions/check-answer:
 *   post:
 *     summary: Verificar la respuesta de un estudiante a una pregunta
 *     tags: [Questions, Evaluations]
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
 *         description: Resultado de la verificación de la respuesta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnswerCheckResponse'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/questions/check-answer', auth, questionsController.checkAnswer);

// Rutas de análisis
/**
 * @swagger
 * /api/education/questions/{studentId}/{questionId}/performance:
 *   get:
 *     summary: Obtener análisis de rendimiento de un estudiante en una pregunta específica
 *     tags: [Student Analytics]
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la pregunta.
 *     responses:
 *       200:
 *         description: Análisis de rendimiento.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceAnalyticsResponse' # Definir este schema
 */

// Rutas de análisis
router.get('/questions/:studentId/:questionId/performance', auth, questionsController.getPerformanceAnalysis);

/**
 * @swagger
 * /api/education/questions/{studentId}/{subjectId}/{subcategoryId}/patterns:
 *   get:
 *     summary: Obtener patrones de aprendizaje de un estudiante en una materia/subcategoría
 *     tags: [Student Analytics]
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
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la materia.
 *       - in: path
 *         name: subcategoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la subcategoría.
 *     responses:
 *       200:
 *         description: Patrones de aprendizaje.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceAnalyticsResponse' # O un schema específico para patrones
 */
router.get('/questions/:studentId/:subjectId/:subcategoryId/patterns', auth, questionsController.getLearningPatterns);

// Websocket routes
/**
 * @swagger
 * /api/education/ws/questions/{subjectId}/{subcategoryId}:
 *   get:
 *     summary: Endpoint para iniciar conexión WebSocket para preguntas en tiempo real (informativo)
 *     description: Este endpoint HTTP podría ser usado para negociar una conexión WebSocket. La documentación de WebSockets está fuera del alcance estándar de OpenAPI para HTTP.
 *     tags: [Questions, System Utilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la materia.
 *       - in: path
 *         name: subcategoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la subcategoría.
 *     responses:
 *       101: 
 *         description: Switching Protocols (Conexión WebSocket establecida).
 *       400:
 *         description: Solicitud inválida para WebSocket.
 */
router.get('/ws/questions/:subjectId/:subcategoryId', auth, (req, res) => {
    /**
     * Manejar conexión WebSocket.
     * @param {object} req - Objeto de solicitud HTTP.
     * @param {object} res - Objeto de respuesta HTTP.
     */
    const ws = new WebSocket(req);

    /**
     * Manejar mensajes de WebSocket.
     * @param {string} message - Mensaje recibido a través de la conexión WebSocket.
     */
    ws.on('message', (message) => {
        // Manejar mensajes de WebSocket
    });

    /**
     * Manejar desconexión de WebSocket.
     */
    ws.on('close', () => {
        // Manejar desconexión
    });
});

// Rutas de caché
/**
 * @swagger
 * /api/education/cache/flush:
 *   get:
 *     summary: Limpiar una clave específica de la caché o toda la caché
 *     tags: [System Utilities]
 *     security:
 *       - bearerAuth: [] # Probablemente requiera rol de administrador
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         description: Clave específica de caché a limpiar. Si se omite, podría limpiar toda la caché (depende de la implementación).
 *     responses:
 *       200:
 *         description: Caché limpiada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Error al limpiar la caché.
 */
router.get('/cache/flush', auth, async (req, res) => {
    try {
        await cacheService.del(req.query.key);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas de notificaciones
router.post('/notifications', auth, async (req, res) => {
    try {
        await notificationService.notifyUser(req.user.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas de exámenes
/**
 * @swagger
 * /api/education/exams:
 *   post:
 *     summary: Crear un nuevo examen
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: [] # Usualmente para roles de profesor/administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamCreationInput'
 *     responses:
 *       201:
 *         description: Examen creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponse'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/exams', auth, examController.createExam);

/**
 * @swagger
 * /api/education/exams/{id}:
 *   get:
 *     summary: Obtener detalles de un examen específico
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del examen.
 *     responses:
 *       200:
 *         description: Detalles del examen.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponse'
 *       404:
 *         description: Examen no encontrado.
 */
router.get('/exams/:id', auth, examController.getExam);

/**
 * @swagger
 * /api/education/exams/{examId}/start:
 *   post:
 *     summary: Iniciar una sesión de examen para el usuario autenticado
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del examen a iniciar.
 *     responses:
 *       200:
 *         description: Sesión de examen iniciada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSessionResponse'
 *       400:
 *         description: El examen no se puede iniciar (ej. ya iniciado, fuera de fecha).
 *       404:
 *         description: Examen no encontrado.
 */
router.post('/exams/:examId/start', auth, examController.startExam);

/**
 * @swagger
 * /api/education/exams/{sessionId}/pause:
 *   post:
 *     summary: Pausar una sesión de examen activa
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión de examen a pausar.
 *     responses:
 *       200:
 *         description: Sesión de examen pausada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSessionResponse'
 *       400:
 *         description: La sesión no se puede pausar.
 *       404:
 *         description: Sesión no encontrada.
 */
router.post('/exams/:sessionId/pause', auth, examController.pauseExam);

/**
 * @swagger
 * /api/education/exams/{sessionId}/resume:
 *   post:
 *     summary: Reanudar una sesión de examen pausada
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión de examen a reanudar.
 *     responses:
 *       200:
 *         description: Sesión de examen reanudada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSessionResponse'
 *       400:
 *         description: La sesión no se puede reanudar.
 *       404:
 *         description: Sesión no encontrada.
 */
router.post('/exams/:sessionId/resume', auth, examController.resumeExam);

/**
 * @swagger
 * /api/education/exams/{sessionId}/submit:
 *   post:
 *     summary: Enviar las respuestas de una sesión de examen
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión de examen a enviar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamSubmissionInput'
 *     responses:
 *       200:
 *         description: Examen enviado para evaluación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSessionResponse' # O un schema específico de sumisión
 *       400:
 *         description: Error al enviar el examen (ej. tiempo expirado, respuestas inválidas).
 *       404:
 *         description: Sesión no encontrada.
 */
router.post('/exams/:sessionId/submit', auth, examController.submitExam);

// Rutas de evaluación
/**
 * @swagger
 * /api/education/evaluations/{sessionId}/score:
 *   get:
 *     summary: Calcular y obtener el puntaje de una sesión de examen enviada
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión de examen evaluada.
 *     responses:
 *       200:
 *         description: Puntaje y detalles de la evaluación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvaluationScoreResponse'
 *       404:
 *         description: Sesión no encontrada o no evaluada.
 */

// Rutas de evaluación
router.get('/evaluations/:sessionId/score', auth, evaluationController.calculateScore);

/**
 * @swagger
 * /api/education/evaluations/{examId}/gaussian:
 *   post:
 *     summary: Aplicar una curva gaussiana a las calificaciones de un examen
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: [] # Generalmente para administradores/profesores
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del examen al cual aplicar la curva.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GaussianCurveInput'
 *     responses:
 *       200:
 *         description: Curva aplicada y calificaciones actualizadas.
 *       400:
 *         description: Datos de entrada inválidos.
 *       404:
 *         description: Examen no encontrado.
 */
router.post('/evaluations/:examId/gaussian', auth, evaluationController.applyGaussianCurve);

/**
 * @swagger
 * /api/education/evaluations/review:
 *   post:
 *     summary: Solicitar la revisión de una pregunta específica de un examen
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionReviewInput'
 *     responses:
 *       200:
 *         description: Solicitud de revisión enviada.
 *       400:
 *         description: Datos de entrada inválidos.
 *       404:
 *         description: Sesión o pregunta no encontrada.
 */
router.post('/evaluations/review', auth, evaluationController.reviewQuestion);

/**
 * @swagger
 * /api/education/evaluations/appeal:
 *   post:
 *     summary: Apelar la calificación de un examen
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradeAppealInput'
 *     responses:
 *       200:
 *         description: Apelación recibida.
 *       400:
 *         description: Datos de entrada inválidos.
 *       404:
 *         description: Sesión de examen no encontrada.
 */
router.post('/evaluations/appeal', auth, evaluationController.handleGradeAppeal);

/**
 * @swagger
 * /api/education/evaluations/{examId}/analytics:
 *   get:
 *     summary: Obtener analíticas de rendimiento para un examen completo
 *     tags: [Evaluations, Student Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del examen.
 *     responses:
 *       200:
 *         description: Analíticas del examen.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceAnalyticsResponse' # Definir este schema
 *       404:
 *         description: Examen no encontrado.
 */
router.get('/evaluations/:examId/analytics', auth, evaluationController.getPerformanceAnalytics);

// Rutas de reportes
router.get('/reports/students/:studentId/exams/:examId', auth, evaluationController.generateReport);
router.get('/reports/groups/:groupId/exams/:examId', auth, evaluationController.generateGroupReport);
router.get('/reports/exams/:examId/performance', auth, evaluationController.generatePerformanceChart);

// Rutas de gamificación
router.get('/badges/:studentId', auth, questionsController.getBadges);
router.get('/ranking/:grade', auth, questionsController.getClassRanking);

module.exports = router;
