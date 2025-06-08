const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs');
const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class ReportService {
    constructor() {
        this.pool = null;
        this.reportTypes = {
            DETAILED: 'detailed',
            SUMMARY: 'summary',
            PERFORMANCE: 'performance',
            COMPARISON: 'comparison'
        };
    }

    async initialize() {
        this.pool = getPool();
    }

    async generateStudentReport(studentId, examId) {
        try {
            const examData = await this.pool.request()
                .input('studentId', this.pool.UniqueIdentifier, studentId)
                .input('examId', this.pool.UniqueIdentifier, examId)
                .execute('spGetStudentExamData');
            
            // Crear PDF
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(`reports/student_${studentId}_${examId}.pdf`);
            
            doc.pipe(stream);
            
            // Agregar encabezado
            doc.fontSize(25).text('Reporte de Examen');
            doc.moveDown();
            
            // Agregar datos del estudiante
            doc.fontSize(12).text(`Estudiante: ${examData.recordset[0].studentName}`);
            doc.text(`Examen: ${examData.recordset[0].examTitle}`);
            doc.text(`Fecha: ${examData.recordset[0].examDate}`);
            doc.moveDown();
            
            // Agregar tabla de respuestas
            doc.table(examData.recordset.map(row => ({
                Pregunta: row.questionText,
                Respuesta: row.studentAnswer,
                Correcta: row.correctAnswer,
                Puntos: row.points
            })));
            
            doc.end();
            
            return `reports/student_${studentId}_${examId}.pdf`;
        } catch (error) {
            console.error('Error generating student report:', error);
            throw error;
        }
    }

    async generateGroupReport(groupId, examId) {
        try {
            const groupData = await pool.request()
                .input('groupId', sql.UniqueIdentifier, groupId)
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spGetGroupExamData');
            
            // Crear Excel
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(groupData.recordset);
            
            // Agregar estadísticas
            const stats = this.calculateGroupStats(groupData.recordset);
            const statsSheet = XLSX.utils.json_to_sheet([
                { Metrica: 'Promedio', Valor: stats.average },
                { Metrica: 'Desviación Estándar', Valor: stats.stdDev },
                { Metrica: 'Máximo', Valor: stats.max },
                { Metrica: 'Mínimo', Valor: stats.min }
            ]);
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');
            
            const filename = `reports/group_${groupId}_${examId}.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            return filename;
        } catch (error) {
            console.error('Error generating group report:', error);
            throw error;
        }
    }

    calculateGroupStats(data) {
        const scores = data.map(row => row.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const stdDev = Math.sqrt(
            scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length
        );
        
        return {
            average: avg,
            stdDev: stdDev,
            max: Math.max(...scores),
            min: Math.min(...scores)
        };
    }

    async generatePerformanceChart(examId) {
        try {
            const data = await pool.request()
                .input('examId', sql.UniqueIdentifier, examId)
                .execute('spGetPerformanceData');
            
            // Crear gráfico
            const ctx = document.createElement('canvas').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.recordset.map(row => row.topicName),
                    datasets: [{
                        label: 'Puntuación Promedio',
                        data: data.recordset.map(row => row.avgScore),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Guardar como imagen
            const filename = `reports/performance_${examId}.png`;
            const img = ctx.canvas.toDataURL('image/png');
            fs.writeFileSync(filename, img.replace(/^data:image\/png;base64,/, ''), 'base64');
            
            return filename;
        } catch (error) {
            console.error('Error generating performance chart:', error);
            throw error;
        }
    }

    async generateHistoricalReport(studentId) {
        try {
            const history = await pool.request()
                .input('studentId', sql.UniqueIdentifier, studentId)
                .execute('spGetStudentHistory');
            
            // Crear PDF con historial
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(`reports/history_${studentId}.pdf`);
            
            doc.pipe(stream);
            
            doc.fontSize(25).text('Historial Académico');
            doc.moveDown();
            
            // Agregar tabla de exámenes
            doc.table(history.recordset.map(row => ({
                Examen: row.examTitle,
                Fecha: row.examDate,
                Puntuación: row.score,
                Calificación: row.grade,
                Estado: row.status
            })));
            
            doc.end();
            
            return `reports/history_${studentId}.pdf`;
        } catch (error) {
            console.error('Error generating historical report:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
