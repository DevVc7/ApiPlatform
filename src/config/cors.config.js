const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || process.env.CORS_ORIGIN === '*') {
            callback(null, true);
        } else {
            callback(null, origin === process.env.CORS_ORIGIN);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 3600
};

module.exports = corsOptions;
