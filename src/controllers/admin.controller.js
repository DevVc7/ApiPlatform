const adminService = require('../services/admin.service');
const { ROLES } = require('../middleware/auth.middleware');
const { executeQuery } = require('../config/db');
const bcrypt = require('bcrypt');
const sql = require('mssql');

class AdminController {
    async getAdmins(req, res) {
        try {
            // console.log('Get admins');
            const admins = await executeQuery(`
                SELECT id, name, email, role, created_at 
                FROM users 
                WHERE role IN (@adminRole, @superAdminRole)
            `, { parameters: { adminRole: ROLES.ADMIN, superAdminRole: ROLES.SUPER_ADMIN } });
            
            res.json({
                success: true,
                data: admins.recordset
            });
        } catch (error) {
            console.error('Get admins error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createAdmin(req, res) {
        try {
            const { name, email, password, role } = req.body;
            
            // Verificar si el rol es válido
            if (!Object.values(ROLES).includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            
            // Verificar si el email ya existe
            const existingUser = await executeQuery(`
                SELECT id FROM users WHERE email = ${email}
            `);
            
            if (existingUser.recordset.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            
            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const result = await sql.query`
                INSERT INTO users (name, email, password, role, created_at)
                VALUES (${name}, ${email}, ${hashedPassword}, ${role}, CURRENT_TIMESTAMP)
            `;
            
            res.status(201).json({
                success: true,
                message: 'Admin created successfully',
                data: { id: result.recordset[0].id }
            });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;
            
            const result = await sql.query`
                UPDATE users 
                SET name = ${name}, email = ${email}, role = ${role}
                WHERE id = ${id}
            `;
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Admin not found' });
            }
            
            res.json({
                success: true,
                message: 'Admin updated successfully'
            });
        } catch (error) {
            console.error('Update admin error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteAdmin(req, res) {
        try {
            const { id } = req.params;
            
            const result = await sql.query`
                DELETE FROM users WHERE id = ${id}
            `;
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Admin not found' });
            }
            
            res.json({
                success: true,
                message: 'Admin deleted successfully'
            });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createTemplate(req, res) {
        try {
            const template = await adminService.createTemplate(req.body);
            res.status(201).json(template);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async generateExam(req, res) {
        try {
            const exam = await adminService.generateRandomExam(
                req.params.templateId,
                parseInt(req.query.count)
            );
            res.json(exam);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async scheduleExam(req, res) {
        try {
            const schedule = await adminService.scheduleExam(req.body);
            res.json(schedule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createGroup(req, res) {
        try {
            const group = await adminService.createGroup(req.body);
            res.status(201).json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async assignStudents(req, res) {
        try {
            await adminService.assignStudentsToGroup(
                req.params.groupId,
                req.body.studentIds
            );
            res.json({ message: 'Students assigned successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getDashboardStats(req, res) {
        try {
            const stats = await adminService.getDashboardStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AdminController();
