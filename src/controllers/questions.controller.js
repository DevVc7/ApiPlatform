const { sql } = require('../config/db');
const { authorize } = require('../middleware/auth.middleware');
const subjectService = require('../services/subject.service');
const mlService = require('../services/ml.service');

// Validar estructura de pregunta
const validateQuestion = (question) => {
    const requiredFields = ['subjectId', 'subcategoryId', 'type', 'content', 'points'];
    return requiredFields.every(field => field in question);
};

// Validar archivo CSV
const validateCSV = (csvData) => {
    const requiredHeaders = ['subjectId', 'subcategoryId', 'type', 'content', 'points'];
    const headers = Object.keys(csvData[0]);
    return requiredHeaders.every(header => headers.includes(header));
};

// Plantilla CSV
const CSV_TEMPLATE = `subjectId,subcategoryId,type,content,points,options,correctAnswer
math,algebra,multiple_choice,"¿Cuál es el resultado de 2x + 3 = 7?",1,"[\"2\",\"3\",\"4\",\"5\"]","3"
communication,grammar,true_false,"La oración 'El gato negro' es correcta",1,"[]","true"`;

// CRUD de preguntas (solo para administradores)
exports.createQuestion = async (req, res) => {
    try {
        const question = req.body;
        
        // Validar estructura
        if (!validateQuestion(question)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid question structure'
            });
        }

        // Validar materia y subcategoría
        const subject = subjectService.getSubjectInfo(question.subjectId);
        if (!subject) {
            return res.status(400).json({
                success: false,
                message: 'Subject not found'
            });
        }

        const subcategory = subjectService.getSubcategoryInfo(question.subjectId, question.subcategoryId);
        if (!subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        // Validar permisos
        authorize(['manage_questions'])(req, res, async () => {
            const result = await sql.query`
                INSERT INTO questions 
                (subject_id, subcategory_id, type, content, options, correct_answer, points, 
                created_by, created_at)
                VALUES 
                (${question.subjectId}, ${question.subcategoryId}, ${question.type}, 
                ${question.content}, ${JSON.stringify(question.options || [])}, 
                ${question.correctAnswer}, ${question.points},
                ${req.user.id}, CURRENT_TIMESTAMP)
            `;

            // Notificar a los suscriptores
            await notificationService.notifySubscribers(
                `questions/${question.subjectId}/${question.subcategoryId}`,
                {
                    type: 'new_question',
                    message: 'New question added',
                    data: {
                        id: result.recordset[0].id,
                        subject: subject.name,
                        subcategory: subcategory.name
                    }
                }
            );

            // Limpiar caché relacionado
            await cacheService.del(`questions:${question.subjectId}:${question.subcategoryId}`);

            res.status(201).json({
                success: true,
                message: 'Question created successfully',
                data: { id: result.recordset[0].id }
            });
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Nueva ruta para análisis de rendimiento
exports.getPerformanceAnalysis = async (req, res) => {
    try {
        const { studentId, questionId } = req.params;
        
        // Verificar caché
        const cacheKey = `performance:${studentId}:${questionId}`;
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
            return res.json({
                success: true,
                data: cached
            });
        }

        const performance = await analyzePerformance(studentId, questionId);
        
        if (performance) {
            // Almacenar en caché
            await cacheService.set(cacheKey, performance, 3600);
        }

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        console.error('Get performance analysis error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Nueva ruta para patrones de aprendizaje
exports.getLearningPatterns = async (req, res) => {
    try {
        const { studentId, subjectId, subcategoryId } = req.params;
        
        const patterns = await detectLearningPatterns(studentId, subjectId, subcategoryId);
        
        res.json({
            success: true,
            data: patterns
        });
    } catch (error) {
        console.error('Get learning patterns error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Actualizar ruta de recomendaciones
exports.getRecommendedQuestions = async (req, res) => {
    try {
        const { studentId, subjectId, subcategoryId } = req.query;
        
        const recommendations = await getEnhancedRecommendations(studentId, subjectId, subcategoryId);
        
        // Notificar al estudiante
        await notificationService.notifyUser(studentId, {
            type: 'recommendations',
            message: 'New question recommendations available',
            data: {
                subject: subjectService.getSubjectInfo(subjectId).name,
                subcategory: subjectService.getSubcategoryInfo(subjectId, subcategoryId).name
            }
        });

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Get recommended questions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Cargar preguntas masivas desde CSV
exports.importQuestions = async (req, res) => {
    try {
        const csvData = req.body; // Se espera un array de objetos
        
        // Validar estructura del CSV
        if (!validateCSV(csvData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CSV structure',
                template: CSV_TEMPLATE
            });
        }

        // Validar permisos
        authorize(['manage_questions'])(req, res, async () => {
            const results = [];
            for (const question of csvData) {
                try {
                    const result = await sql.query`
                        INSERT INTO questions 
                        (subject_id, subcategory_id, type, content, options, correct_answer, points, 
                        created_by, created_at)
                        VALUES 
                        (${question.subjectId}, ${question.subcategoryId}, ${question.type}, 
                        ${question.content}, ${JSON.stringify(question.options || [])}, 
                        ${question.correctAnswer}, ${question.points},
                        ${req.user.id}, CURRENT_TIMESTAMP)
                    `;
                    results.push({ success: true, id: result.recordset[0].id });
                } catch (error) {
                    results.push({ success: false, error: error.message });
                }
            }

            res.json({
                success: true,
                message: 'Questions imported successfully',
                results,
                template: CSV_TEMPLATE
            });
        });
    } catch (error) {
        console.error('Import questions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            template: CSV_TEMPLATE
        });
    }
};

// Búsqueda de preguntas
exports.searchQuestions = async (req, res) => {
    try {
        const { subjectId, subcategoryId, difficulty, type, search } = req.query;
        
        const query = sql.query`
            SELECT q.*
            FROM questions q
            WHERE 1=1
            ${subjectId && sql`AND q.subject_id = ${subjectId}`}
            ${subcategoryId && sql`AND q.subcategory_id = ${subcategoryId}`}
            ${difficulty && sql`AND q.difficulty = ${difficulty}`}
            ${type && sql`AND q.type = ${type}`}
            ${search && sql`
                AND (
                    q.content LIKE ${`%${search}%`} 
                    OR q.explanation LIKE ${`%${search}%`}
                )
            `}
            ORDER BY NEWID()
            OFFSET 0 ROWS
            FETCH NEXT ${req.query.limit || 10} ROWS ONLY
        `;

        const results = await query;
        res.json({
            success: true,
            data: results.recordset
        });
    } catch (error) {
        console.error('Search questions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Estadísticas por materia/subcategoría
exports.getSubjectStatistics = async (req, res) => {
    try {
        const { subjectId, subcategoryId } = req.query;
        
        const query = sql.query`
            SELECT 
                COUNT(*) as total_questions,
                AVG(points) as average_points,
                MIN(points) as min_points,
                MAX(points) as max_points,
                COUNT(DISTINCT type) as question_types
            FROM questions
            WHERE 1=1
            ${subjectId && sql`AND subject_id = ${subjectId}`}
            ${subcategoryId && sql`AND subcategory_id = ${subcategoryId}`}
        `;

        const results = await query;
        res.json({
            success: true,
            data: results.recordset[0]
        });
    } catch (error) {
        console.error('Get subject statistics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Generación de exámenes aleatorios
exports.generateRandomExam = async (req, res) => {
    try {
        const { subjectId, subcategoryId, questionCount, difficulty } = req.query;
        
        const query = sql.query`
            SELECT TOP ${questionCount} q.*
            FROM questions q
            WHERE q.subject_id = ${subjectId}
            AND q.subcategory_id = ${subcategoryId}
            ${difficulty && sql`AND q.difficulty = ${difficulty}`}
            ORDER BY NEWID()
        `;

        const results = await query;
        res.json({
            success: true,
            data: {
                questions: results.recordset,
                subject: subjectService.getSubjectInfo(subjectId),
                subcategory: subjectService.getSubcategoryInfo(subjectId, subcategoryId)
            }
        });
    } catch (error) {
        console.error('Generate random exam error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Sistema de recomendación
exports.getRecommendedQuestions = async (req, res) => {
    try {
        const { studentId, subjectId, subcategoryId } = req.query;
        
        // Obtener rendimiento del estudiante
        const performance = await mlService.getStudentPerformance(studentId, subjectId, subcategoryId);
        
        // Generar recomendaciones basadas en rendimiento
        const recommendations = await sql.query`
            SELECT TOP 5 q.*
            FROM questions q
            WHERE q.subject_id = ${subjectId}
            AND q.subcategory_id = ${subcategoryId}
            AND q.difficulty BETWEEN ${performance.difficulty - 0.2} 
            AND ${performance.difficulty + 0.2}
            ORDER BY NEWID()
        `;

        res.json({
            success: true,
            data: {
                recommendations: recommendations.recordset,
                performance
            }
        });
    } catch (error) {
        console.error('Get recommended questions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// CRUD de preguntas (solo para administradores)
exports.getQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await sql.query`
            SELECT * FROM questions WHERE id = ${id}
        `;

        if (question.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Question not found' 
            });
        }

        res.json({
            success: true,
            data: question.recordset[0]
        });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Manejo de preguntas para estudiantes
exports.getAdaptiveQuestion = async (req, res) => {
    try {
        const { studentId, subjectId, subcategoryId } = req.params;
        
        // Obtener contenido adaptativo usando ML
        const content = await mlService.getAdaptiveContent(studentId, subjectId, subcategoryId);
        
        // Obtener la próxima pregunta recomendada
        const nextQuestion = await sql.query`
            SELECT * FROM questions 
            WHERE subject_id = ${content.content.subjectId}
            AND subcategory_id = ${content.content.subcategoryId}
            AND difficulty BETWEEN ${content.content.difficulty - 0.1} 
            AND ${content.content.difficulty + 0.1}
            ORDER BY NEWID()
            OFFSET 0 ROWS
            FETCH NEXT 1 ROWS ONLY
        `;

        if (nextQuestion.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No questions available' 
            });
        }

        res.json({
            success: true,
            data: {
                question: nextQuestion.recordset[0],
                recommendations: content.content.recommendations
            }
        });
    } catch (error) {
        console.error('Get adaptive question error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

exports.checkAnswer = async (req, res) => {
    try {
        const { studentId, questionId, selectedAnswer } = req.body;
        
        const question = await sql.query`
            SELECT * FROM questions WHERE id = ${questionId}
        `;

        if (question.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Question not found' 
            });
        }

        const isCorrect = question.recordset[0].correct_answer === selectedAnswer;
        
        // Actualizar perfil del estudiante
        await mlService.updateStudentProfile(studentId, {
            [question.recordset[0].subject_id]: isCorrect ? 1 : 0,
            overall: isCorrect ? 1 : 0
        });

        res.json({
            success: true,
            isCorrect,
            explanation: question.recordset[0].explanation
        });
    } catch (error) {
        console.error('Check answer error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Gamificación
exports.getBadges = async (req, res) => {
    try {
        const { studentId } = req.params;
        const badges = await mlService.getBadges(studentId);
        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

exports.getClassRanking = async (req, res) => {
    try {
        const { grade } = req.params;
        const ranking = await mlService.getClassRanking(grade);
        res.json({
            success: true,
            data: ranking
        });
    } catch (error) {
        console.error('Get class ranking error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// CRUD de preguntas (solo para administradores)
exports.createQuestion = async (req, res) => {
    try {
        const { 
            topic,
            difficulty,
            question,
            options,
            correctAnswer,
            explanation,
            mediaUrl,
            gradeLevel
        } = req.body;

        // Validar permisos
        authorize(['manage_questions'])(req, res, async () => {
            const result = await sql.query`
                INSERT INTO questions 
                (topic, difficulty, question, options, correct_answer, explanation, 
                media_url, grade_level, created_by, created_at)
                VALUES 
                (${topic}, ${difficulty}, ${question}, ${JSON.stringify(options)}, 
                ${correctAnswer}, ${explanation}, ${mediaUrl}, ${gradeLevel},
                ${req.user.id}, CURRENT_TIMESTAMP)
            `;

            res.status(201).json({
                success: true,
                message: 'Question created successfully',
                data: { id: result.recordset[0].id }
            });
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


