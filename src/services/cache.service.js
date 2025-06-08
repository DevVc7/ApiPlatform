const Redis = require('ioredis');
const { promisify } = require('util');

// Configuración de Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// Promisify Redis methods
const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const delAsync = promisify(redis.del).bind(redis);

class CacheService {
    constructor() {
        this.prefix = 'exam-';
    }

    async get(key) {
        try {
            const value = await getAsync(`${this.prefix}${key}`);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) { // 1 hour default TTL
        try {
            await setAsync(`${this.prefix}${key}`, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            await delAsync(`${this.prefix}${key}`);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Cache middleware
    async cacheMiddleware(req, res, next) {
        try {
            // Generar clave única basada en la ruta y parámetros
            const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}:${JSON.stringify(req.params)}`;
            
            // Intentar obtener de caché
            const cachedResponse = await this.get(cacheKey);
            
            if (cachedResponse) {
                return res.json(cachedResponse);
            }

            // Continuar con el middleware normal
            const originalSend = res.send;
            
            res.send = function(body) {
                // Almacenar en caché antes de enviar
                this.cacheService.set(cacheKey, body);
                originalSend.call(this, body);
            };

            res.cacheService = this;
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    }

    // Invalidation middleware
    async invalidateCache(req, res, next) {
        try {
            // Generar clave única basada en la ruta y parámetros
            const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}:${JSON.stringify(req.params)}`;
            
            // Invalidar caché
            await this.del(cacheKey);
            next();
        } catch (error) {
            console.error('Cache invalidation error:', error);
            next();
        }
    }
}

module.exports = new CacheService();
