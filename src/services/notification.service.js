const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class NotificationService {
    constructor() {
        this.wss = new WebSocket.Server({ noServer: true });
        this.clients = new Map();
        this.subscriptions = new Map();
    }

    // Inicializar el servidor WebSocket
    async init(server) {
        this.wss.on('connection', (ws, req) => {
            const userId = req.headers['x-user-id'];
            
            if (!userId) {
                ws.close();
                return;
            }

            this.clients.set(userId, ws);
            
            ws.on('close', () => {
                this.clients.delete(userId);
                this.subscriptions.delete(userId);
            });

            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'subscribe') {
                    this.subscriptions.set(userId, data.topic);
                }
            });
        });

        server.on('upgrade', (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        });
    }

    // Enviar notificación a un usuario específico
    async notifyUser(userId, notification) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'notification',
                ...notification
            }));
        }
    }

    // Enviar notificación a todos los usuarios
    async notifyAll(notification) {
        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    ...notification
                }));
            }
        });
    }

    // Enviar notificación a usuarios que se suscriban a un tema
    async notifySubscribers(topic, notification) {
        this.clients.forEach((ws, userId) => {
            const userTopic = this.subscriptions.get(userId);
            if (userTopic === topic && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    ...notification
                }));
            }
        });
    }

    // Crear notificación
    async createNotification(data) {
        return {
            id: uuidv4(),
            type: data.type,
            message: data.message,
            data: data.data,
            timestamp: new Date().toISOString(),
            read: false
        };
    }
}

module.exports = new NotificationService();
