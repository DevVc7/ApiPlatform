const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class AntiCheatService {
    constructor() {
        this.activeSessions = new Map();
        this.sessionScreenshots = new Map();
    }

    async startMonitoring(sessionId, userId) {
        try {
            // Verificar si ya existe una sesión activa
            if (this.activeSessions.has(userId)) {
                throw new Error('Multiple sessions detected');
            }
            
            this.activeSessions.set(userId, sessionId);
            
            // Guardar en la base de datos
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .input('userId', sql.UniqueIdentifier, userId)
                .input('startTime', sql.DateTime, new Date())
                .execute('spStartMonitoring');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error starting monitoring:', error);
            throw error;
        }
    }

    async stopMonitoring(sessionId) {
        try {
            // Eliminar de la lista activa
            const userId = Array.from(this.activeSessions.entries())
                .find(([_, s]) => s === sessionId)?.[0];
            
            if (userId) {
                this.activeSessions.delete(userId);
            }
            
            // Guardar en la base de datos
            const result = await pool.request()
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .input('endTime', sql.DateTime, new Date())
                .execute('spStopMonitoring');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error stopping monitoring:', error);
            throw error;
        }
    }

    async takeScreenshot(sessionId) {
        try {
            // Generar ID único para la captura
            const screenshotId = uuidv4();
            
            // Guardar en la base de datos
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, screenshotId)
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .input('timestamp', sql.DateTime, new Date())
                .execute('spSaveScreenshot');
            
            // Almacenar en memoria para análisis rápido
            if (!this.sessionScreenshots.has(sessionId)) {
                this.sessionScreenshots.set(sessionId, []);
            }
            
            this.sessionScreenshots.get(sessionId).push(screenshotId);
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error taking screenshot:', error);
            throw error;
        }
    }

    async analyzeSession(sessionId) {
        try {
            // Obtener todas las capturas de la sesión
            const screenshots = await pool.request()
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .execute('spGetSessionScreenshots');
            
            // Analizar patrones sospechosos
            const analysis = this.analyzeScreenshots(screenshots.recordset);
            
            // Guardar análisis en la base de datos
            const result = await pool.request()
                .input('sessionId', sql.UniqueIdentifier, sessionId)
                .input('analysis', sql.NVarChar, JSON.stringify(analysis))
                .input('suspicious', sql.Bit, analysis.suspicious)
                .execute('spSaveAnalysis');
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error analyzing session:', error);
            throw error;
        }
    }

    analyzeScreenshots(screenshots) {
        const analysis = {
            suspicious: false,
            patterns: [],
            frequency: {}
        };
        
        // Analizar patrones de cambio
        for (let i = 0; i < screenshots.length - 1; i++) {
            const current = screenshots[i];
            const next = screenshots[i + 1];
            
            // Verificar cambios rápidos
            if (next.timestamp - current.timestamp < 1000) {
                analysis.patterns.push({
                    type: 'QUICK_CHANGE',
                    timestamp: current.timestamp
                });
            }
            
            // Verificar cambios en ventanas activas
            if (current.activeWindow !== next.activeWindow) {
                analysis.patterns.push({
                    type: 'WINDOW_CHANGE',
                    timestamp: current.timestamp
                });
            }
        }
        
        // Determinar si es sospechoso
        analysis.suspicious = analysis.patterns.length > 3;
        
        return analysis;
    }

    async detectMultipleSessions(userId) {
        try {
            const activeSession = this.activeSessions.get(userId);
            if (!activeSession) {
                return false;
            }
            
            // Verificar si hay otras sesiones activas
            const sessions = Array.from(this.activeSessions.entries())
                .filter(([u, s]) => u !== userId && s === activeSession);
            
            return sessions.length > 0;
        } catch (error) {
            console.error('Error detecting multiple sessions:', error);
            throw error;
        }
    }
}

module.exports = new AntiCheatService();
