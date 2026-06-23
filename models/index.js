const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// ---------- LOAD ALL MODELS ----------
try {
    const modelFiles = fs.readdirSync(__dirname)
        .filter(file => file !== 'index.js' && file.endsWith('.js'));

    if (modelFiles.length === 0) {
        console.warn('⚠️ No model files found in the models directory.');
    }

    for (const file of modelFiles) {
        const modelPath = path.join(__dirname, file);
        // Load the model definition and pass the sequelize instance
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
    // In production, never force sync (would drop tables)
    if (process.env.NODE_ENV === 'production' && options.force) {
        console.warn('⚠️ Force sync is disabled in production. Ignoring force option.');
        delete options.force;
    }
    try {
        await sequelize.sync(options);
        console.log('✅ All models synced with database');
    } catch (error) {
        console.error('❌ Error syncing models:', error.message);
        throw error;
    }
};

module.exports = db;
