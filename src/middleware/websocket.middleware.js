const WebSocket = require('ws');

class WebSocketMiddleware {
    constructor() {
        this.clients = new Set();
    }

    init(server) {
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            
            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'exam-start':
                    this.handleExamStart(ws, data);
                    break;
                case 'exam-pause':
                    this.handleExamPause(ws, data);
                    break;
                case 'exam-resume':
                    this.handleExamResume(ws, data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    handleExamStart(ws, data) {
        // Implementar lógica de inicio de examen
    }

    handleExamPause(ws, data) {
        // Implementar lógica de pausa de examen
    }

    handleExamResume(ws, data) {
        // Implementar lógica de reanudación de examen
    }
}

module.exports = new WebSocketMiddleware();
