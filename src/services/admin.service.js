const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const examService = require('./exam.service');
const questionService = require('./question.service');

class AdminService {
    constructor() {
        this.examService = examService;
        this.questionService = questionService;
    }

    async createTemplate(templateData) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('name', sql.NVarChar, templateData.name)
                .input('description', sql.NVarChar, templateData.description)
                .input('topicId', sql.UniqueIdentifier, templateData.topicId)
                .execute('spCreateExamTemplate');
            
            // Asignar preguntas a la plantilla
            if (templateData.questions) {
                await this.assignQuestionsToTemplate(result.recordset[0].id, templateData.questions);
            }
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    async assignQuestionsToTemplate(templateId, questionIds) {
        try {
            const request = pool.request();
            
            // Deshacer cualquier asignación previa
            await request
                .input('templateId', sql.UniqueIdentifier, templateId)
                .execute('spDeleteTemplateQuestions');
            
            // Crear nuevas asignaciones
            for (const questionId of questionIds) {
                await request
                    .input('templateId', sql.UniqueIdentifier, templateId)
                    .input('questionId', sql.UniqueIdentifier, questionId)
                    .execute('spAssignQuestionToTemplate');
            }
        } catch (error) {
            console.error('Error assigning questions:', error);
            throw error;
        }
    }

    async generateRandomExam(templateId, count) {
        try {
            const template = await pool.request()
                .input('templateId', sql.UniqueIdentifier, templateId)
                .execute('spGetTemplateById');
            
            const questions = await this.questionService.getRandomQuestionsByTopic(
                template.recordset[0].topicId,
                count
            );
            
            const examData = {
                title: `${template.recordset[0].name} - ${new Date().toISOString()}`,
                description: template.recordset[0].description,
                duration: template.recordset[0].duration,
                topicId: template.recordset[0].topicId,
                maxAttempts: template.recordset[0].maxAttempts,
                questions: questions.map(q => q.id)
            };
            
            return await this.examService.createExam(examData);
        } catch (error) {
            console.error('Error generating exam:', error);
            throw error;
        }
    }

    async scheduleExam(examData) {
        try {
            const result = await pool.request()
                .input('examId', sql.UniqueIdentifier, examData.examId)
                .input('groupId', sql.UniqueIdentifier, examData.groupId)
                .input('startDate', sql.DateTime, examData.startDate)
                .input('endDate', sql.DateTime, examData.endDate)
                .execute('spScheduleExam');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error scheduling exam:', error);
            throw error;
        }
    }

    async createGroup(groupData) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('name', sql.NVarChar, groupData.name)
                .input('description', sql.NVarChar, groupData.description)
                .input('courseId', sql.UniqueIdentifier, groupData.courseId)
                .execute('spCreateGroup');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    async assignStudentsToGroup(groupId, studentIds) {
        try {
            const request = pool.request();
            
            // Deshacer cualquier asignación previa
            await request
                .input('groupId', sql.UniqueIdentifier, groupId)
                .execute('spDeleteGroupStudents');
            
            // Crear nuevas asignaciones
            for (const studentId of studentIds) {
                await request
                    .input('groupId', sql.UniqueIdentifier, groupId)
                    .input('studentId', sql.UniqueIdentifier, studentId)
                    .execute('spAssignStudentToGroup');
            }
        } catch (error) {
            console.error('Error assigning students:', error);
            throw error;
        }
    }

    async getDashboardStats() {
        try {
            const result = await pool.request()
                .execute('spGetDashboardStats');
            
            return {
                totalExams: result.recordset[0].totalExams,
                activeExams: result.recordset[0].activeExams,
                totalStudents: result.recordset[0].totalStudents,
                pendingReviews: result.recordset[0].pendingReviews,
                recentActivity: result.recordset[0].recentActivity
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }
}

module.exports = new AdminService();
