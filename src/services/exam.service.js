const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const questionService = require('./question.service');

class ExamService {
    constructor() {
        this.pool = null;
        this.questionService = null;
    }

    async initialize() {
        this.pool = getPool();
        this.questionService = questionService; // Use the imported instance
        if (this.questionService && typeof this.questionService.initialize === 'function') {
            await this.questionService.initialize();
        }
    }

    async createExam(examData) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('title', sql.NVarChar, examData.title)
                .input('description', sql.NVarChar, examData.description)
                .input('duration', sql.Int, examData.duration)
                .input('startDate', sql.DateTime, examData.startDate)
                .input('endDate', sql.DateTime, examData.endDate)
                .input('topicId', sql.UniqueIdentifier, examData.topicId)
                .input('maxAttempts', sql.Int, examData.maxAttempts)
                .execute('spCreateExam');
            
            // Asignar preguntas al examen
            if (examData.questions) {
                await this.assignQuestionsToExam(result.recordset[0].id, examData.questions);
            }
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating exam:', error);
            throw error;
        }
    }

    async assignQuestionsToExam(examId, questionIds) {
        try {
            const request = pool.request();
            
            // Deshacer cualquier asignación previa
            await request
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spDeleteExamQuestions');
            
            // Crear nuevas asignaciones
            for (const questionId of questionIds) {
                await request
                    .input('examId', sql.UniqueIdentifier, examId)
                    .input('questionId', sql.UniqueIdentifier, questionId)
                    .execute('spAssignQuestionToExam');
            }
        } catch (error) {
            console.error('Error assigning questions:', error);
            throw error;
        }
    }

    async getExamById(examId) {
        try {
            const result = await pool.request()
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spGetExamById');
            
            const exam = result.recordset[0];
            if (exam) {
                // Obtener preguntas del examen
                const questionsResult = await pool.request()
                    .input('examId', sql.UniqueIdentifier, examId)
                    .execute('spGetExamQuestions');
                
                exam.questions = questionsResult.recordset;
            }
            
            return exam;
        } catch (error) {
            console.error('Error getting exam:', error);
            throw error;
        }
    }

    async startExam(examId, userId) {
        try {
            const result = await pool.request()
                .input('examId', sql.UniqueIdentifier, examId)
                .input('userId', sql.UniqueIdentifier, userId)
                .input('sessionId', sql.UniqueIdentifier, uuidv4())
                .execute('spStartExam');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error starting exam:', error);
            throw error;
        }
    }

    async pauseExam(sessionId) {
        try {
            const result = await pool.request()
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .execute('spPauseExam');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error pausing exam:', error);
            throw error;
        }
    }

    async resumeExam(sessionId) {
        try {
            const result = await pool.request()
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .execute('spResumeExam');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error resuming exam:', error);
            throw error;
        }
    }

    async submitExam(sessionId, answers) {
        try {
            const request = pool.request();
            
            // Guardar respuestas
            for (const answer of answers) {
                await request
                    .input('sessionId', sql.UniqueIdentifier, sessionId)
                    .input('questionId', sql.UniqueIdentifier, answer.questionId)
                    .input('answer', sql.NVarChar, answer.answer)
                    .execute('spSaveAnswer');
            }
            
            // Calcular puntuación
            const scoreResult = await request
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .execute('spCalculateScore');
            
            return scoreResult.recordset[0];
        } catch (error) {
            console.error('Error submitting exam:', error);
            throw error;
        }
    }
}

module.exports = new ExamService();
