const examService = require('../services/exam.service');
const questionService = require('../services/question.service');
const antiCheatService = require('../services/anti_cheat.service');
const subjectService = require('../services/subject.service');

class ExamController {
    constructor() {
        this.examService = null;
        this.questionService = null;
        this.antiCheatService = null;
        this.subjectService = null;
    }

    async initialize() {
        this.examService = examService;
        if (this.examService && typeof this.examService.initialize === 'function') {
            await this.examService.initialize();
        }
        this.questionService = questionService;
        if (this.questionService && typeof this.questionService.initialize === 'function') {
            await this.questionService.initialize();
        }
        this.antiCheatService = antiCheatService;
        if (this.antiCheatService && typeof this.antiCheatService.initialize === 'function') {
            await this.antiCheatService.initialize();
        }
        this.subjectService = subjectService;
        if (this.subjectService && typeof this.subjectService.initialize === 'function') {
            await this.subjectService.initialize();
        }
    }
    async createExam(req, res) {
        try {
            // Validar que la materia y subcategoría existan
            const { subjectId, subcategoryId } = req.body;
            const subject = this.subjectService.getSubjectInfo(subjectId);
            if (!subject) {
                return res.status(400).json({ error: 'Subject not found' });
            }
            
            const subcategory = this.subjectService.getSubcategoryInfo(subjectId, subcategoryId);
            if (!subcategory) {
                return res.status(400).json({ error: 'Subcategory not found' });
            }

            const exam = await this.examService.createExam(req.body);
            res.status(201).json(exam);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getExam(req, res) {
        try {
            const exam = await this.examService.getExamById(req.params.id);
            if (!exam) {
                return res.status(404).json({ error: 'Exam not found' });
            }
            
            // Agregar información de materia y subcategoría
            const subject = this.subjectService.getSubjectInfo(exam.subjectId);
            const subcategory = this.subjectService.getSubcategoryInfo(exam.subjectId, exam.subcategoryId);
            
            res.json({
                ...exam,
                subject: {
                    name: subject.name,
                    subcategory: subcategory.name
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAvailableSubjects(req, res) {
        try {
            const subjects = this.subjectService.getAvailableSubjects();
            res.json(subjects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getQuestionsBySubcategory(req, res) {
        try {
            const { subjectId, subcategoryId } = req.params;
            
            // Validar que existan
            const subject = this.subjectService.getSubjectInfo(subjectId);
            if (!subject) {
                return res.status(404).json({ error: 'Subject not found' });
            }
            
            const subcategory = this.subjectService.getSubcategoryInfo(subjectId, subcategoryId);
            if (!subcategory) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }

            const questions = await this.subjectService.getQuestionsBySubcategory(
                subcategoryId,
                parseInt(req.query.count)
            );
            
            res.json({
                questions,
                subject: {
                    name: subject.name,
                    subcategory: subcategory.name
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createQuestion(req, res) {
        try {
            const { subjectId, subcategoryId } = req.body;
            
            // Validar que existan
            const subject = this.subjectService.getSubjectInfo(subjectId);
            if (!subject) {
                return res.status(404).json({ error: 'Subject not found' });
            }
            
            const subcategory = this.subjectService.getSubcategoryInfo(subjectId, subcategoryId);
            if (!subcategory) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }

            const question = await this.questionService.createQuestion(req.body);
            res.status(201).json({
                question,
                subject: {
                    name: subject.name,
                    subcategory: subcategory.name
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startExam(req, res) {
        try {
            const examSession = await this.examService.startExam(
                req.params.examId,
                req.user.id
            );
            
            // Iniciar monitoreo anti-cheat
            await this.antiCheatService.startMonitoring(examSession.id, req.user.id);
            
            res.json(examSession);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async pauseExam(req, res) {
        try {
            const examSession = await this.examService.pauseExam(req.params.sessionId);
            res.json(examSession);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async resumeExam(req, res) {
        try {
            const examSession = await this.examService.resumeExam(req.params.sessionId);
            res.json(examSession);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async submitExam(req, res) {
        try {
            const result = await this.examService.submitExam(
                req.params.sessionId,
                req.body.answers
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ExamController();
