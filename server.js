require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS CONFIGURATION ----------
const allowedOrigins = [
    // Production frontend domains
    'https://bomayangu.site',
    'https://www.bomayangu.site',
    // Vercel preview URLs (keep for safety)
    'https://bomayangu-frontend-3yqn.vercel.app',
    'https://bomayangu-frontend.vercel.app',
    'https://bomayangu.vercel.app',
    // Local development
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5000',
    // IPv6 loopback (for local dev)
    'http://[::1]:3000',
    'http://[::1]:5500',
    'http://[::1]:5000',
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`CORS blocked: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));

// ---------- MIDDLEWARE ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log incoming requests in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
    });
}

// ---------- ROUTES ----------
app.use('/api', routes);

// ---------- HEALTH CHECK ----------
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------- ERROR HANDLER ----------
app.use(errorHandler);

// ---------- START SERVER ----------
const startServer = async () => {
    try {
        const dialect = process.env.DIALECT || 'mysql';
        const host = process.env.DB_HOST;
        const port = process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306);
        const database = process.env.DB_NAME;

        console.log(`🔌 Attempting to connect to ${dialect} database:`);
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Database: ${database}`);
        console.log(`   User: ${process.env.DB_USER}`);
        console.log(`   SSL: ${process.env.DB_SSL !== 'false'}`);

        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synced (development)');
        } else {
            console.log('✅ Production mode – skipping auto-sync');
        }

        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await sequelize.close();
                    console.log('Database connection closed.');
                } catch (err) {
                    console.error('Error closing database:', err);
                }
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            shutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });

        console.log('✅ Server is ready to accept connections.');

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error('❌ Full error details:', error);
        process.exit(1);
    }
};

startServer();
