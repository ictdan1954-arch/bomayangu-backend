const { sequelize } = require('./models');

async function resetSequence() {
    try {
        await sequelize.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
        console.log('✅ Users sequence reset successfully.');
        console.log('✅ All sequences reset successfully.');
    } catch (error) {
        console.error('❌ Error resetting sequence:', error);
    } finally {
        await sequelize.close();
    }
}
resetSequence();
