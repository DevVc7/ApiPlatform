const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'audit.log' }),
        new winston.transports.Console()
    ]
});

class AuditService {
    async logAction(userId, actionType, details) {
        try {
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, uuidv4())
                .input('userId', sql.UniqueIdentifier, userId)
                .input('actionType', sql.NVarChar, actionType)
                .input('details', sql.NVarChar, JSON.stringify(details))
                .input('timestamp', sql.DateTime, new Date())
                .execute('spLogAuditAction');
            
            logger.info({
                userId,
                actionType,
                details,
                timestamp: new Date()
            });
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error logging audit action:', error);
            throw error;
        }
    }

    async getAuditLogs(userId, startDate, endDate) {
        try {
            const result = await pool.request()
                .input('userId', sql.UniqueIdentifier, userId)
                .input('startDate', sql.DateTime, startDate)
                .input('endDate', sql.DateTime, endDate)
                .execute('spGetAuditLogs');
            return result.recordset;
        } catch (error) {
            console.error('Error getting audit logs:', error);
            throw error;
        }
    }
}

module.exports = new AuditService();
