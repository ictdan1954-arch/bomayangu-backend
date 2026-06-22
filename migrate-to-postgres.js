// migrate-to-postgres.js
// Run: node migrate-to-postgres.js

const { Sequelize } = require('sequelize');

// ---------- MySQL (source) ----------
const mysqlSequelize = new Sequelize(
    'defaultdb',                // database name (Aiven)
    'avnadmin',                 // user (Aiven)
    'AVNS_9zLtzHu33nxFxmCNMha', // password (Aiven)
    {
        host: 'bomayangu-db-ictdan1954-4ded.a.aivencloud.com',
        port: 19402,
        dialect: 'mysql',
        logging: false
    }
);

// ---------- PostgreSQL (target) ----------
// ✅ UPDATE THIS WITH YOUR RENDER POSTGRES INTERNAL URL
const postgresUrl = 'postgresql://bomayangu_db_user:gHrW1xx0CkyPY6QnVyQrrv0rEHAyAUmw@dpg-d8so0qa8qa3s73chd1eg-a/bomayangu_db';

const postgresSequelize = new Sequelize(postgresUrl, {
    dialect: 'postgres',
    logging: false
});

// ---------- Define models (PostgreSQL compatible) ----------
const { DataTypes } = require('sequelize');

// Define models for PostgreSQL
const User = postgresSequelize.define('User', {
    full_name: DataTypes.STRING,
    id_number: { type: DataTypes.STRING, unique: true },
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    county: DataTypes.STRING,
    constituency: DataTypes.STRING,
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    password: DataTypes.STRING
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Job = postgresSequelize.define('Job', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    salary: DataTypes.INTEGER,
    slots: DataTypes.STRING,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'jobs', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Application = postgresSequelize.define('Application', {
    user_id: DataTypes.INTEGER,
    job_id: DataTypes.INTEGER,
    job_title: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    payment_method: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 78 },
    applied_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    paid_at: DataTypes.DATE,
    payment_provider: DataTypes.STRING,
    payment_response: DataTypes.JSON
}, { tableName: 'applications', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Payment = postgresSequelize.define('Payment', {
    application_id: DataTypes.INTEGER,
    transaction_id: DataTypes.STRING,
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_method: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    merchant_request_id: DataTypes.STRING,
    checkout_request_id: DataTypes.STRING,
    result_code: DataTypes.INTEGER,
    result_desc: DataTypes.TEXT,
    callback_data: DataTypes.JSON,
    provider: DataTypes.STRING,
    paid_at: DataTypes.DATE
}, { tableName: 'payments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Config = postgresSequelize.define('Config', {
    key: { type: DataTypes.STRING, unique: true },
    value: DataTypes.TEXT
}, { tableName: 'config', timestamps: true, updatedAt: 'updated_at', createdAt: false });

// ---------- Migration function ----------
async function migrate() {
    try {
        // 1. Connect to both databases
        await mysqlSequelize.authenticate();
        console.log('✅ Connected to MySQL (Aiven)');
        await postgresSequelize.authenticate();
        console.log('✅ Connected to PostgreSQL (Render)');

        // 2. Create tables in PostgreSQL using Sequelize sync
        await postgresSequelize.sync({ force: true }); // Careful: drops existing tables
        console.log('✅ PostgreSQL tables created (or replaced).');

        // 3. Copy data from MySQL to PostgreSQL
        const tables = ['users', 'jobs', 'applications', 'payments', 'config'];
        const ModelMap = {
            users: User,
            jobs: Job,
            applications: Application,
            payments: Payment,
            config: Config
        };

        for (const table of tables) {
            const [rows] = await mysqlSequelize.query(`SELECT * FROM ${table}`);
            if (rows.length === 0) {
                console.log(`⏭️ ${table} has no rows – skipping.`);
                continue;
            }
            console.log(`📥 Copying ${rows.length} rows from ${table}...`);
            const model = ModelMap[table];
            await model.bulkCreate(rows, { ignoreDuplicates: true });
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mysqlSequelize.close();
        await postgresSequelize.close();
    }
}

migrate();
