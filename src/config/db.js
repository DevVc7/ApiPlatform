const sql = require('mssql');
require('dotenv').config();

const dbConnectionSettings = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER, // Will be ignored by mssql if trustedConnection is true
    password: process.env.DB_PASSWORD, // Will be ignored by mssql if trustedConnection is true
    port: parseInt(process.env.DB_PORT, 10),
    trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true',
    options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE ? (process.env.DB_TRUST_SERVER_CERTIFICATE === 'true') : true,
        enableArithAbort: true
    }
};

// Validate port parsing and provide a default if necessary
if (isNaN(dbConnectionSettings.port)) {
    if (process.env.DB_PORT) {
        console.warn(`[DB Config] DB_PORT '${process.env.DB_PORT}' is not a valid number. Defaulting to 1433.`);
    }
    dbConnectionSettings.port = 1433; // Default SQL Server port
}

let pool;

const connectDB = async () => {
    try {
        pool = await sql.connect(dbConnectionSettings);
        console.log('Conexión exitosa a la base de datos');
        return pool;
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        // Log the configuration being used for easier debugging (excluding password)
        const { password, ...configForLog } = dbConnectionSettings;
        console.error('Using connection config:', configForLog);
        throw error;
    }
};

const executeQuery = async (query) => {
    try {
        if (!pool) {
            throw new Error('Database not initialized. Please call connectDB() first.');
        }
        const request = pool.request();
        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('Error al ejecutar consulta:', error);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized. Please call connectDB() first.');
    }
    return pool;
};

module.exports = { connectDB, executeQuery, getPool };


