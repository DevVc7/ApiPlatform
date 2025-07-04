const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/db');

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign({ 
        userId,
        role
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    
    const refreshToken = jwt.sign({ 
        userId,
        role
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    });
    
    return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const result = await executeQuery(`
            SELECT id, password, role 
            FROM users 
            WHERE email = @email
        `, { parameters: { email } });
        
        const request = result;
        
        if (request.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = request.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const tokens = generateTokens(user.id, user.role);
        
        return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
