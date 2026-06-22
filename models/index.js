const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// ---------- LOAD ALL MODELS ----------
try {
    const modelFiles = fs.readdirSync(__dirname)
        .filter(file => file !== 'index.js' && file.endsWith('.js'));

    for (const file of modelFiles) {
        const modelPath = path.join(__dirname, file);
        const model = require(modelPath)(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
        console.log(`✅ Model loaded: ${model.name}`);
    }
} catch (error) {
    console.error('❌ Error loading models:', error.message);
    process.exit(1); // Exit if models can't be loaded
}

// ---------- SETUP ASSOCIATIONS ----------
try {
    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
            console.log(`✅ Associations set up for: ${modelName}`);
        }
    });
} catch (error) {
    console.error('❌ Error setting up associations:', error.message);
    process.exit(1);
}

// ---------- EXPORT ----------
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// ---------- CONVENIENCE METHOD: SYNC ALL MODELS ----------
db.syncAll = async (options = {}) => {
    await sequelize.sync(options);
    console.log('✅ All models synced with database');
};

module.exports = db;
