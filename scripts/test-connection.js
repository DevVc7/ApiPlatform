const { Connection, Request } = require('tedious');

const config = {
    server: 'DESKTOP-0LUNG54',
    authentication: {
        type: 'default',
        options: {
            integratedSecurity: true
        }
    },
    options: {
        database: 'master',
        encrypt: true,
        trustServerCertificate: true
    }
};

function testConnection() {
    console.log('Intentando conectarse...');
    const connection = new Connection(config);
    
    connection.on('connect', (err) => {
        if (err) {
            console.error('Error al conectar:', err);
            return;
        }
        
        console.log('Conexión exitosa!');
        
        const request = new Request('SELECT @@VERSION as version', (err) => {
            if (err) {
                console.error('Error al ejecutar consulta:', err);
                return;
            }
            console.log('Consulta ejecutada exitosamente');
        });

        request.on('row', (columns) => {
            columns.forEach(column => {
                console.log(column.value);
            });
        });

        connection.execSql(request);
    });

    connection.on('error', (err) => {
        console.error('Error de conexión:', err);
    });
}

testConnection();
