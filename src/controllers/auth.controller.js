const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    });
    
    return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const request = await sql.query`
            SELECT id, password, role 
            FROM users 
            WHERE email = ${email}
        `;
        
        if (request.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = request.recordset[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }
        
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }
            
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
            
            res.json({
                success: true,
                accessToken,
                refreshToken: newRefreshToken
            });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        // Aquí podrías implementar lógica para invalidar el token si lo necesitas
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
