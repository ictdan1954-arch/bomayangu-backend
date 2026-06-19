module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        application_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'pending'
        },
        merchant_request_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        checkout_request_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        result_code: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        result_desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        callback_data: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'payments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.Application, { foreignKey: 'application_id' });
    };

    return Payment;
};
