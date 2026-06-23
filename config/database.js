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
const sslEnabled = process.env.DB_SSL !== 'false';
const sslOptions = sslEnabled ? {
    require: true,
    rejectUnauthorized: false   // Required for free tiers
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
        dialectOptions: {
            ssl: sslOptions,
            keepAlive: true,                     // Keep connections alive
            keepAliveInitialDelayMillis: 0,      // Send keep‑alive immediately
            connectTimeout: 60000                // SSL handshake timeout
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            idle: 10000,          // Release idle connections after 10s
            acquire: 30000,       // Timeout if can't acquire
            evict: 1000           // Check idle connections every second
        },
        retry: {
            max: 3,
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionAcquireTimeoutError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            backoffBase: 1000,
            backoffExponent: 1.5
        }
    }
);

module.exports = sequelize;
