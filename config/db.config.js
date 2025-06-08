require('dotenv').config();

module.exports = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'EducationDB',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        integratedSecurity: true
    }
};
