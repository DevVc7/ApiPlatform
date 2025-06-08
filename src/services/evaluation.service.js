const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class EvaluationService {
    constructor() {
        this.pool = null;
        this.gradingScale = {
            A: [90, 100],
            B: [80, 89],
            C: [70, 79],
            D: [60, 69],
            F: [0, 59]
        };
    }

    async initialize() {
        this.pool = getPool();
    }

    async calculateScore(examSessionId) {
        try {
            const result = await this.pool.request()
                .input('examSessionId', sql.UniqueIdentifier, examSessionId)
                .execute('spCalculateExamScore');
            
            const score = result.recordset[0];
            if (score) {
                score.grade = this.calculateLetterGrade(score.totalScore);
                score.performance = this.calculatePerformance(score.totalScore);
            }
            
            return score;
        } catch (error) {
            console.error('Error calculating score:', error);
            throw error;
        }
    }

    calculateLetterGrade(score) {
        for (const [grade, range] of Object.entries(this.gradingScale)) {
            if (score >= range[0] && score <= range[1]) {
                return grade;
            }
        }
        return 'F';
    }

    calculatePerformance(score) {
        if (score >= 90) return 'Excelente';
        if (score >= 80) return 'Muy Bueno';
        if (score >= 70) return 'Bueno';
        if (score >= 60) return 'Regular';
        return 'Insuficiente';
    }

    async applyGaussianCurve(examId) {
        try {
            const result = await pool.request()
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spApplyGaussianCurve');
            
            return result.recordset;
        } catch (error) {
            console.error('Error applying Gaussian curve:', error);
            throw error;
        }
    }

    async reviewOpenQuestion(reviewData) {
        try {
            const result = await pool.request()
                .input('reviewId', sql.UniqueIdentifier, uuidv4())
                .input('answerId', sql.UniqueIdentifier, reviewData.answerId)
                .input('points', sql.Decimal, reviewData.points)
                .input('comments', sql.NVarChar, reviewData.comments)
                .input('reviewerId', sql.UniqueIdentifier, reviewData.reviewerId)
                .execute('spReviewOpenQuestion');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error reviewing question:', error);
            throw error;
        }
    }

    async handleGradeAppeal(appealData) {
        try {
            const result = await pool.request()
                .input('appealId', sql.UniqueIdentifier, uuidv4())
                .input('examSessionId', sql.UniqueIdentifier, appealData.examSessionId)
                .input('reason', sql.NVarChar, appealData.reason)
                .input('studentId', sql.UniqueIdentifier, appealData.studentId)
                .input('status', sql.NVarChar, 'PENDING')
                .execute('spCreateGradeAppeal');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error handling grade appeal:', error);
            throw error;
        }
    }

    async getPerformanceAnalytics(examId) {
        try {
            const result = await pool.request()
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spGetPerformanceAnalytics');
            
            return {
                averageScore: result.recordset[0].averageScore,
                standardDeviation: result.recordset[0].standardDeviation,
                topicPerformance: result.recordset[0].topicPerformance,
                questionDifficulty: result.recordset[0].questionDifficulty
            };
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }
}

module.exports = new EvaluationService();
