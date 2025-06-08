require('dotenv').config();

const { Connection, Request } = require('tedious');
const fs = require('fs');
const path = require('path');

// Configuración para tedious
const connectionConfig = {
    server: process.env.DB_SERVER,
    authentication: {
        type: 'windows',
        options: {
            integratedSecurity: true,
            domain: process.env.USERDOMAIN
        }
    },
    options: {
        database: process.env.DB_DATABASE,
        encrypt: true,
        trustServerCertificate: true
    }
};

// Función para ejecutar consultas
async function executeQuery(connection, query) {
    return new Promise((resolve, reject) => {
        const request = new Request(query, (err) => {
            if (err) reject(err);
            resolve();
        });
        
        connection.execSql(request);
    });
}

function runMigrations() {
    console.log('Iniciando proceso de migración...');
    console.log('Configuración:', connectionConfig);

    // Conexión a la base de datos maestra
    console.log('Conectando a master...');
    const masterConfig = {
        ...connectionConfig,
        options: {
            ...connectionConfig.options,
            database: 'master'
        }
    };

    const masterPool = new Connection(masterConfig);
    masterPool.on('connect', (err) => {
        if (err) {
            console.error('Error al conectar a master:', err);
            return;
        }
        console.log('Conexión a master exitosa');

        // Crear la base de datos si no existe
        console.log('Verificando y creando base de datos...');
        const request = new Request(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${connectionConfig.options.database}')
            BEGIN
                CREATE DATABASE ${connectionConfig.options.database};
                PRINT 'Base de datos creada: ' + N'${connectionConfig.options.database}';
            END;
            ELSE
                PRINT 'Base de datos ya existe: ' + N'${connectionConfig.options.database}';
        `);

        request.on('requestCompleted', (rowCount, more) => {
            console.log('Base de datos verificada');

            // Cerrar conexión con master
            masterPool.close();
            console.log('Conexión a master cerrada');

            // Conectar a la nueva BD
            console.log('Conectando a la base de datos:', connectionConfig.options.database);
            const pool = new Connection(connectionConfig);
            pool.on('connect', (err) => {
                if (err) {
                    console.error('Error al conectar a la base de datos:', err);
                    return;
                }
                console.log('Conexión exitosa');

                // Leer y ejecutar migraciones en orden
                console.log('Buscando archivos de migración...');
                const migrations = fs.readdirSync('../database/migrations')
                    .filter(file => file.endsWith('.sql'))
                    .sort();

                console.log('Migraciones encontradas:', migrations);
                
                for (const migration of migrations) {
                    console.log(`\nEjecutando migración: ${migration}`);
                    const sql = fs.readFileSync(path.join('../database/migrations', migration), 'utf8');
                    console.log('SQL:', sql.substring(0, 200) + '...');
                    
                    const request = new Request(sql);

                    request.on('requestCompleted', (rowCount, more) => {
                        console.log(`Migración ${migration} ejecutada exitosamente`);
                    });

                    request.on('row', (columns) => {
                        columns.forEach(column => {
                            console.log(column.value);
                        });
                    });

                    request.on('error', (err) => {
                        console.error(`Error al ejecutar migración ${migration}:`, err);
                    });

                    pool.execSql(request);
                }
            });
        });

        request.on('error', (err) => {
            console.error('Error al crear base de datos:', err);
        });

        masterPool.execSql(request);
    });
}

runMigrations();
