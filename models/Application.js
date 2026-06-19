module.exports = (sequelize, DataTypes) => {
    const Application = sequelize.define('Application', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        job_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        job_title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'pending'
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 78
        },
        applied_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'applications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Application.associate = (models) => {
        Application.belongsTo(models.User, { foreignKey: 'user_id' });
        Application.belongsTo(models.Job, { foreignKey: 'job_id' });
        Application.hasOne(models.Payment, { foreignKey: 'application_id' });
    };

    return Application;
};
