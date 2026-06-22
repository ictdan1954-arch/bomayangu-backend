const { Sequelize } = require('sequelize');

// ---------- ENVIRONMENT VARIABLE CHECKS ----------
const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length) {
    console.warn(`⚠️ Missing database environment variables: ${missing.join(', ')}`);
}

// ---------- DATABASE CONNECTION ----------
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',

        // SSL configuration (required for Aiven, can be toggled via env)
        dialectOptions: {
            ssl: process.env.DB_SSL === 'false' ? false : {
                require: true,
                rejectUnauthorized: false   // Required for Aiven's free tier
            }
        },

        // Logging: only show SQL in development
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // Connection pool settings for production
        pool: {
            max: 10,          // Maximum number of connections
            min: 0,           // Minimum number of idle connections
            acquire: 30000,   // Max time (ms) to get a connection
            idle: 10000       // Max time (ms) a connection can be idle before being released
        },

        // Retry logic for connection failures
        retry: {
            max: 3,
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/
            ]
        }
    }
);

// ---------- TEST CONNECTION ON STARTUP (optional) ----------
// The actual test is performed in server.js, but we can add a direct check here.
// This is done in server.js, so we keep it clean.

module.exports = sequelize;
