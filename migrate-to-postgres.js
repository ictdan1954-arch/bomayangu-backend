// migrate-to-postgres.js
// Run: node migrate-to-postgres.js

const { Sequelize } = require('sequelize');

// ---------- MySQL (source - Aiven) ----------
const mysqlSequelize = new Sequelize(
    'defaultdb',
    'avnadmin',
    'AVNS_9zLtzHu33nxFxmCNMha',
    {
        host: 'bomayangu-db-ictdan1954-4ded.a.aivencloud.com',
        port: 19402,
        dialect: 'mysql',
        logging: false
    }
);

// ---------- PostgreSQL (target - Render) ----------
// ✅ Using EXTERNAL URL for local access (includes full domain)
const postgresUrl = 'postgresql://bomayangu_db_user:gHrW1xx0CkyPY6QnVyQrrv0rEHAyAUmw@dpg-d8so0qa8qa3s73chd1eg-a.oregon-postgres.render.com/bomayangu_db';

const postgresSequelize = new Sequelize(postgresUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false   // Required for Render free SSL
        }
    }
});

// ---------- Define models for PostgreSQL ----------
const { DataTypes } = require('sequelize');

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
        console.log('🔌 Connecting to MySQL (Aiven)...');
        await mysqlSequelize.authenticate();
        console.log('✅ Connected to MySQL (Aiven)');

        console.log('🔌 Connecting to PostgreSQL (Render)...');
        await postgresSequelize.authenticate();
        console.log('✅ Connected to PostgreSQL (Render)');

        console.log('📦 Creating tables in PostgreSQL...');
        await postgresSequelize.sync({ force: true });
        console.log('✅ PostgreSQL tables created.');

        const tables = ['users', 'jobs', 'applications', 'payments', 'config'];
        const ModelMap = {
            users: User,
            jobs: Job,
            applications: Application,
            payments: Payment,
            config: Config
        };

        for (const table of tables) {
            console.log(`📥 Copying ${table}...`);
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
        console.log('🎉 Your data is now in Render PostgreSQL!');
    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mysqlSequelize.close();
        await postgresSequelize.close();
    }
}

migrate();
