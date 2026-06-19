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
    'https://bomayangu-frontend.vercel.app',  // your Vercel frontend
    'https://bomayangu.vercel.app',          // alternative (if you use custom domain)
    'http://localhost:3000',                 // local frontend dev
    'http://localhost:5500',                 // local frontend dev (Live Server)
    'http://localhost:5000'                  // local frontend dev
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------- MIDDLEWARE ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- ROUTES ----------
app.use('/api', routes);

// ---------- ERROR HANDLER ----------
app.use(errorHandler);

// ---------- HEALTH CHECK ----------
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------- START SERVER ----------
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        // Only sync in development – in production, use migrations
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synced (development)');
        } else {
            console.log('✅ Production mode – skipping auto-sync');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
