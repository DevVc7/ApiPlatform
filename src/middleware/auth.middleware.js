const jwt = require('jsonwebtoken');

// Roles disponibles
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
};

// Permisos por rol
const PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        'manage_admins',
        'manage_courses',
        'manage_questions',
        'manage_students',
        'generate_reports',
        'view_audit_logs',
        'manage_grades',
        'manage_content',
        'manage_topics',
        'manage_badges',
        'view_analytics'
    ],
    [ROLES.ADMIN]: [
        'manage_admins',
        'manage_courses',
        'manage_questions',
        'manage_students',
        'generate_reports',
        'view_audit_logs',
        'manage_grades',
        'manage_content',
        'manage_topics',
        'manage_badges',
        'view_analytics'
    ],
    [ROLES.TEACHER]: [
        'view_courses',
        'view_questions',
        'view_students',
        'view_reports',
        'view_analytics',
        'manage_content',
        'manage_topics'
    ],
    [ROLES.STUDENT]: [
        'view_courses',
        'answer_questions',
        'view_progress',
        'view_badges',
        'view_ranking'
    ]
};

// Configuración de seguridad
const SECURITY = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d'
};

// Middleware de manejo de intentos de inicio de sesión
const handleLoginAttempts = (req, res, next) => {
    try {
        const { email } = req.body;
        
        // Verificar intentos fallidos
        const failedAttempts = req.app.locals.failedLoginAttempts[email] || 0;
        
        if (failedAttempts >= SECURITY.MAX_LOGIN_ATTEMPTS) {
            const lastFailedTime = req.app.locals.lastFailedLoginTime[email];
            const currentTime = Date.now();
            
            if (currentTime - lastFailedTime < SECURITY.LOCKOUT_DURATION) {
                return res.status(429).json({
                    message: 'Account locked. Please wait 30 minutes or contact support',
                    support: process.env.SUPPORT_WHATSAPP
                });
            }
            
            // Resetear intentos fallidos
            req.app.locals.failedLoginAttempts[email] = 0;
        }
        
        next();
    } catch (error) {
        console.error('Login attempts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Actualizar middleware de autenticación
const auth = async (req, res, next) => {
    try {
        console.log('Headers recibidos:', req.headers);
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token recibido:', token);
        
        if (!token) {
            console.log('No se recibió token en el header Authorization');
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);
            
            // Inicializar el objeto de tokens bloqueados si no existe
            if (!req.app.locals.blockedTokens) {
                req.app.locals.blockedTokens = new Set();
            }
            
            // Verificar si el token está bloqueado
            if (req.app.locals.blockedTokens.has(token)) {
                console.log('Token bloqueado');
                return res.status(401).json({ message: 'Token blocked' });
            }
            
            // Usar el rol que viene en el token
            const userRole = decoded.role;
            console.log('Rol del usuario:', userRole);
            
            // Verificar si el rol existe en los permisos
            if (!PERMISSIONS[userRole]) {
                return res.status(403).json({ message: 'Role not authorized' });
            }

            // Verificar si es un estudiante que necesita cambiar la contraseña
            if (userRole === ROLES.STUDENT) {
                try {
                    const query = `
                        SELECT mustChangePassword 
                        FROM Users 
                        WHERE email = @email
                    `;

                    const result = await executeQuery(query, {
                        parameters: {
                            email: decoded.email
                        }
                    });

                    if (result.recordset && result.recordset[0] && result.recordset[0].mustChangePassword) {
                        return res.status(403).json({ 
                            message: 'Password change required', 
                            code: 'PASSWORD_CHANGE_REQUIRED' 
                        });
                    }
                } catch (dbError) {
                    console.error('Error checking mustChangePassword:', dbError);
                    return res.status(500).json({ message: 'Database error' });
                }
            }
            
            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error('Error al verificar JWT:', jwtError);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        // Registrar intentos fallidos
        const { email } = req.body;
        if (email) {
            req.app.locals.failedLoginAttempts[email] = 
                (req.app.locals.failedLoginAttempts[email] || 0) + 1;
            req.app.locals.lastFailedLoginTime[email] = Date.now();
        }
        
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};


// Middleware de autorización por permiso específico
const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            const userPermissions = PERMISSIONS[req.user.role];
            
            if (!userPermissions) {
                return res.status(403).json({ message: 'Role not authorized' });
            }
            
            const hasPermission = requiredPermissions.every(permission => 
                userPermissions.includes(permission)
            );
            
            if (!hasPermission) {
                return res.status(403).json({ message: 'Permission denied' });
            }
            
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(403).json({ message: 'Authorization failed' });
        }
    };
};

// Middleware para verificar roles específicos
const verifyRole = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!requiredRoles.includes(req.user.role)) {
                return res.status(403).json({ 
                    message: 'Role not authorized',
                    requiredRoles: requiredRoles
                });
            }
            next();
        } catch (error) {
            console.error('Role verification error:', error);
            res.status(403).json({ message: 'Role verification failed' });
        }
    };
};

// Middleware específico para SuperAdmin
const authSuperAdmin = (req, res, next) => {
    try {
        if (req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(403).json({ message: 'SuperAdmin access required' });
        }
        next();
    } catch (error) {
        console.error('SuperAdmin auth error:', error);
        res.status(403).json({ message: 'SuperAdmin authentication failed' });
    }
};

// Middleware para verificar roles ADMIN o SUPER_ADMIN
const requireAdmin = verifyRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

module.exports = { 
    auth,
    authSuperAdmin,
    authorize,
    verifyRole,
    ROLES,
    PERMISSIONS
};
