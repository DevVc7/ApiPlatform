const EvaluationService = require('../services/evaluation.service');
const ReportService = require('../services/report.service');

class EvaluationController {
    constructor() {
        this.evaluationService = null;
        this.reportService = null;
    }

    async initialize() {
        this.evaluationService = new EvaluationService();
        await this.evaluationService.initialize();
        this.reportService = new ReportService();
        await this.reportService.initialize();
    }

    async calculateScore(req, res) {
        try {
            const score = await this.evaluationService.calculateScore(req.params.sessionId);
            res.json(score);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async applyGaussianCurve(req, res) {
        try {
            const result = await this.evaluationService.applyGaussianCurve(req.params.examId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async reviewQuestion(req, res) {
        try {
            const review = await this.evaluationService.reviewOpenQuestion(req.body);
            res.json(review);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleGradeAppeal(req, res) {
        try {
            const appeal = await this.evaluationService.handleGradeAppeal(req.body);
            res.json(appeal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPerformanceAnalytics(req, res) {
        try {
            const analytics = await this.evaluationService.getPerformanceAnalytics(req.params.examId);
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async generateReport(req, res) {
        try {
            const report = await this.reportService.generateStudentReport(
                req.params.studentId,
                req.params.examId
            );
            res.download(report);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async generateGroupReport(req, res) {
        try {
            const report = await this.reportService.generateGroupReport(
                req.params.groupId,
                req.params.examId
            );
            res.download(report);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async generatePerformanceChart(req, res) {
        try {
            const chart = await this.reportService.generatePerformanceChart(req.params.examId);
            res.download(chart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new EvaluationController();
