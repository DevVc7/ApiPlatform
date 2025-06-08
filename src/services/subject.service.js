const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class SubjectService {
    constructor() {
        this.subjects = {
            'math': {
                name: 'Matemática',
                subcategories: [
                    { id: 'algebra', name: 'Álgebra' },
                    { id: 'trigonometry', name: 'Trigonometría' },
                    { id: 'geometry', name: 'Geometría' },
                    { id: 'calculus', name: 'Cálculo' }
                ]
            },
            'communication': {
                name: 'Comunicación',
                subcategories: [
                    { id: 'grammar', name: 'Gramática' },
                    { id: 'literature', name: 'Literatura' },
                    { id: 'oral', name: 'Comunicación Oral' },
                    { id: 'written', name: 'Comunicación Escrita' }
                ]
            }
        };
    }

    async getSubject(subjectId) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, subjectId)
                .execute('spGetSubjectById');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error getting subject:', error);
            throw error;
        }
    }

    async getSubcategories(subjectId) {
        try {
            const result = await pool.request()
                .input('subjectId', sql.UniqueIdentifier, subjectId)
                .execute('spGetSubcategories');
            
            return result.recordset;
        } catch (error) {
            console.error('Error getting subcategories:', error);
            throw error;
        }
    }

    async getQuestionsBySubcategory(subcategoryId, count) {
        try {
            const result = await pool.request()
                .input('subcategoryId', sql.UniqueIdentifier, subcategoryId)
                .input('count', sql.Int, count)
                .execute('spGetQuestionsBySubcategory');
            
            return result.recordset;
        } catch (error) {
            console.error('Error getting questions:', error);
            throw error;
        }
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
                .input('subcategoryId', sql.UniqueIdentifier, questionData.subcategoryId)
                .execute('spCreateQuestion');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating question:', error);
            throw error;
        }
    }

    getSubjectInfo(subjectId) {
        return this.subjects[subjectId];
    }

    getSubcategoryInfo(subjectId, subcategoryId) {
        const subject = this.subjects[subjectId];
        if (!subject) return null;
        return subject.subcategories.find(s => s.id === subcategoryId);
    }

    getAvailableSubjects() {
        return Object.entries(this.subjects).map(([id, subject]) => ({
            id,
            name: subject.name,
            subcategories: subject.subcategories
        }));
    }
}

module.exports = new SubjectService();
