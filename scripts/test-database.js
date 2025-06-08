const { Connection, Request } = require('tedious');
const dotenv = require('dotenv');

dotenv.config();

// Configuración para conexión
const config = {
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

const connection = new Connection(config);

// Función para ejecutar consultas
async function executeQuery(query) {
    return new Promise((resolve, reject) => {
        const request = new Request(query, (err) => {
            if (err) reject(err);
            resolve();
        });

        request.on('row', (columns) => {
            columns.forEach(column => {
                console.log(column.value);
            });
        });

        connection.execSql(request);
    });
}

async function testDatabase() {
    try {
        // Conectar a la base de datos
        console.log('Conectando a la base de datos...');
        connection.on('connect', (err) => {
            if (err) {
                console.error('Error al conectar:', err);
                return;
            }
            console.log('Conexión exitosa!');

            // 1. Verificar que las tablas existen
            console.log('\nVerificando tablas...');
            executeQuery(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
            `);

            // 2. Insertar un registro de prueba en subjects
            console.log('\nInsertando registro de prueba en subjects...');
            const subjectId = '00000000-0000-0000-0000-000000000001';
            executeQuery(`
                INSERT INTO subjects (id, name, description)
                VALUES ('${subjectId}', 'Matemáticas', 'Contenido de matemáticas')
            `);

            // 3. Insertar una subcategoría
            console.log('\nInsertando subcategoría...');
            const subcategoryId = '00000000-0000-0000-0000-000000000002';
            executeQuery(`
                INSERT INTO subcategories (id, subject_id, name, description)
                VALUES ('${subcategoryId}', '${subjectId}', 'Álgebra', 'Contenido de álgebra')
            `);

            // 4. Insertar una pregunta
            console.log('\nInsertando pregunta...');
            const questionId = '00000000-0000-0000-0000-000000000003';
            executeQuery(`
                INSERT INTO questions (id, subject_id, subcategory_id, type, content, correct_answer, points, difficulty, created_by)
                VALUES ('${questionId}', '${subjectId}', '${subcategoryId}', 'multiple_choice',
                       '¿Cuál es el resultado de 2x + 3 = 7?', '2', 1, 1, '00000000-0000-0000-0000-000000000000')
            `);

            // 5. Insertar intento de pregunta
            console.log('\nInsertando intento de pregunta...');
            const attemptId = '00000000-0000-0000-0000-000000000004';
            executeQuery(`
                INSERT INTO question_attempts (id, question_id, student_id, answer, is_correct, elapsed_time)
                VALUES ('${attemptId}', '${questionId}', '00000000-0000-0000-0000-000000000005', '2', 1, 30)
            `);

            // 6. Verificar estadísticas
            console.log('\nVerificando estadísticas...');
            executeQuery(`
                SELECT * FROM performance_stats WHERE question_id = '${questionId}'
            `);

            // 7. Verificar patrones de aprendizaje
            console.log('\nVerificando patrones de aprendizaje...');
            executeQuery(`
                SELECT * FROM learning_patterns WHERE subject_id = '${subjectId}'
            `);

            // 8. Verificar migraciones
            console.log('\nVerificando migraciones...');
            executeQuery(`
                SELECT * FROM migrations
            `);

            // Cerrar conexión
            connection.close();
        });

        connection.connect();
    } catch (error) {
        console.error('Error:', error);
    }
}

testDatabase();
