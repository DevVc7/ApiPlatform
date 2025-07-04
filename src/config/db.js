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

async function executeQuery(query, options) {
    try {
        const pool = await getPool();
        const request = pool.request();
        
        // Agregar parámetros si existen
        if (options && options.parameters) {
            for (const [key, value] of Object.entries(options.parameters)) {
                // Definir tipo de dato según el valor
                let type;
                if (typeof value === 'number') {
                    type = sql.Int;
                } else if (typeof value === 'string') {
                    type = sql.NVarChar;
                } else if (value instanceof Date) {
                    type = sql.DateTime;
                } else if (typeof value === 'boolean') {
                    type = sql.Bit;
                } else {
                    throw new Error(`Tipo de dato no soportado para el parámetro ${key}`);
                }
                
                request.input(key, type, value);
            }
        }
        
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

module.exports = {
    connectDB,
    executeQuery,
    getPool,
    sql
};


