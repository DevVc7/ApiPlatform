const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class QuestionService {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        this.pool = getPool();
    }
    async createQuestion(questionData) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('type', sql.NVarChar, questionData.type)
                .input('content', sql.NVarChar, questionData.content)
                .input('options', sql.NVarChar, JSON.stringify(questionData.options))
                .input('correctAnswer', sql.NVarChar, questionData.correctAnswer)
                .input('points', sql.Decimal, questionData.points)
                .input('topicId', sql.UniqueIdentifier, questionData.topicId)
                .execute('spCreateQuestion');
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating question:', error);
            throw error;
        }
    }

    async getQuestionsByTopic(topicId) {
        try {
            const result = await pool.request()
                .input('topicId', sql.UniqueIdentifier, topicId)
                .execute('spGetQuestionsByTopic');
            return result.recordset;
        } catch (error) {
            console.error('Error getting questions:', error);
            throw error;
        }
    }

    async getRandomQuestionsByTopic(topicId, count) {
        try {
            const result = await pool.request()
                .input('topicId', sql.UniqueIdentifier, topicId)
                .input('count', sql.Int, count)
                .execute('spGetRandomQuestions');
            return result.recordset;
        } catch (error) {
            console.error('Error getting random questions:', error);
            throw error;
        }
    }
}

module.exports = new QuestionService();
