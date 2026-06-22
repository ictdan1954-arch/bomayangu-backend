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
    'https://bomayangu-frontend-3yqn.vercel.app',
    'https://bomayangu-frontend.vercel.app',
    'https://bomayangu.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:5000'
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
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------- MIDDLEWARE ----------
// Parse JSON and URL-encoded bodies with size limits
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

// ---------- ERROR HANDLER (must be last) ----------
app.use(errorHandler);

// ---------- START SERVER ----------
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        // Sync models in development mode only
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synced (development)');
        } else {
            console.log('✅ Production mode – skipping auto-sync');
        }

        // Start listening
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
        });

        // ---------- GRACEFUL SHUTDOWN ----------
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

            // Force shutdown after 10 seconds if not closed
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down.');
                process.exit(1);
            }, 10000);
        };

        // Listen for termination signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions and rejections
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            // Log and continue, but in production you may want to restart
            // In this case, we exit cleanly
            shutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            // Exit cleanly
            shutdown('unhandledRejection');
        });

        console.log('✅ Server is ready to accept connections.');

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// ---------- BOOT ----------
startServer();
