const mssql = require('mssql');
const config = require('../config/db.config');

async function checkDatabase() {
    try {
        const pool = await mssql.connect(config);
        
        // Verificar si la base de datos existe
        const dbExists = await pool.request().query(`
            SELECT name FROM sys.databases WHERE name = N'${config.database}'
        `);
        
        if (dbExists.recordset.length === 0) {
            console.log('La base de datos no existe');
            return;
        }
        
        // Verificar tablas
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        
        console.log('Tablas en la base de datos:');
        tables.recordset.forEach(table => {
            console.log(table.TABLE_NAME);
        });
        
        // Verificar si las tablas específicas existen
        const requiredTables = ['migrations', 'subjects', 'subcategories', 'questions'];
        const missingTables = requiredTables.filter(table => 
            !tables.recordset.some(t => t.TABLE_NAME === table)
        );
        
        if (missingTables.length > 0) {
            console.log('\nTablas faltantes:', missingTables.join(', '));
        } else {
            console.log('\n¡Todas las tablas necesarias están presentes!');
        }
        
    } catch (error) {
        console.error('Error al verificar la base de datos:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

checkDatabase();
