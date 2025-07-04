require('dotenv').config();

module.exports = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'EducationDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        trustServerCertificate: true,
        enableArithAbort: true
    }
};
