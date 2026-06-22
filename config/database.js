const { Sequelize } = require('sequelize');

// ---------- ENVIRONMENT VARIABLE CHECKS ----------
const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length) {
    console.warn(`⚠️ Missing database environment variables: ${missing.join(', ')}`);
}

// ---------- DETECT DIALECT ----------
const dialect = process.env.DIALECT || 'mysql';
const isPostgres = dialect === 'postgres';
const defaultPort = isPostgres ? 5432 : 3306;

// ---------- SSL CONFIGURATION ----------
// Allow SSL to be disabled via DB_SSL=false
const sslEnabled = process.env.DB_SSL !== 'false';
const sslOptions = sslEnabled ? {
    require: true,
    rejectUnauthorized: false   // Required for Aiven (MySQL) and Render (PostgreSQL) free tiers
} : false;

// ---------- DATABASE CONNECTION ----------
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || defaultPort,
        dialect: dialect,

        // Dialect-specific options
        dialectOptions: isPostgres ? {
            ssl: sslOptions
        } : {
            ssl: sslOptions
        },

        // Logging: only show SQL in development
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // Connection pool settings
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
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

module.exports = sequelize;
