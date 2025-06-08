const { sql } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.generateAdminReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const admins = await sql.query`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                COUNT(l.id) as login_count
            FROM users u
            LEFT JOIN login_logs l ON u.id = l.user_id
            WHERE u.role IN ('admin', 'super_admin')
            AND l.created_at BETWEEN ${startDate} AND ${endDate}
            GROUP BY u.id, u.name, u.email, u.role
        `;
        
        // Generar archivo CSV
        const csvContent = [
            'ID,Name,Email,Role,Login Count',
            ...admins.recordset.map(admin => 
                `${admin.id},${admin.name},${admin.email},${admin.role},${admin.login_count}`
            )
        ].join('\n');
        
        const filename = `admin_report_${new Date().toISOString().split('T')[0]}.csv`;
        const filepath = path.join(__dirname, '..', 'reports', filename);
        
        // Crear directorio si no existe
        if (!fs.existsSync(path.join(__dirname, '..', 'reports'))) {
            fs.mkdirSync(path.join(__dirname, '..', 'reports'));
        }
        
        fs.writeFileSync(filepath, csvContent);
        
        res.download(filepath, filename);
    } catch (error) {
        console.error('Generate admin report error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const { startDate, endDate, limit = 100, offset = 0 } = req.query;
        
        const logs = await sql.query`
            SELECT 
                a.id,
                a.user_id,
                u.name as user_name,
                a.action,
                a.details,
                a.created_at
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.created_at BETWEEN ${startDate} AND ${endDate}
            ORDER BY a.created_at DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY
        `;
        
        res.json({
            success: true,
            data: logs.recordset
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
