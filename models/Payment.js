module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique payment ID'
        },
        application_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'References the application',
            references: {
                model: 'applications',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Transaction ID from the payment provider'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: true,
                min: {
                    args: [0.01],
                    msg: 'Amount must be greater than 0'
                }
            },
            comment: 'Payment amount in KES'
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Payment method: stk_push, paybill, manual, etc.'
        },
        provider: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Payment provider: payhero, mpesa, etc.'
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'pending',
            allowNull: false,
            validate: {
                isIn: {
                    args: [['pending', 'completed', 'failed']],
                    msg: 'Status must be pending, completed, or failed'
                }
            },
            comment: 'Payment status: pending, completed, failed'
        },
        merchant_request_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Merchant request ID from M-Pesa (if applicable)'
        },
        checkout_request_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Checkout request ID from M-Pesa (if applicable)'
        },
        result_code: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Result code from the payment provider'
        },
        result_desc: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Result description from the payment provider'
        },
        callback_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Full callback payload from the payment provider'
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when payment was completed'
        }
    }, {
        tableName: 'payments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['application_id']
            },
            {
                fields: ['transaction_id']
            },
            {
                fields: ['checkout_request_id']
            },
            {
                fields: ['status']
            }
        ]
    });

    // ---------- ASSOCIATIONS ----------
    Payment.associate = (models) => {
        Payment.belongsTo(models.Application, { foreignKey: 'application_id' });
    };

    // ---------- HELPER METHODS ----------

    /**
     * Create a payment record after initiating STK Push
     */
    Payment.createFromInitiation = async function(data) {
        const { applicationId, amount, provider, paymentMethod, transactionId, checkoutRequestId, callbackData } = data;
        return this.create({
            application_id: applicationId,
            amount: amount,
            provider: provider || 'payhero',
            payment_method: paymentMethod || 'stk_push',
            status: 'pending',
            transaction_id: transactionId,
            checkout_request_id: checkoutRequestId,
            callback_data: callbackData
        });
    };

    /**
     * Mark a payment as completed (after successful callback)
     */
    Payment.markCompleted = async function(paymentId, transactionId, resultData) {
        const payment = await this.findByPk(paymentId);
        if (!payment) throw new Error('Payment not found');
        payment.status = 'completed';
        if (transactionId) payment.transaction_id = transactionId;
        payment.paid_at = new Date();
        payment.callback_data = { ...payment.callback_data, ...resultData };
        await payment.save();
        return payment;
    };

    /**
     * Mark a payment as failed (after failed callback)
     */
    Payment.markFailed = async function(paymentId, resultDesc, resultCode) {
        const payment = await this.findByPk(paymentId);
        if (!payment) throw new Error('Payment not found');
        payment.status = 'failed';
        payment.result_code = resultCode || 1;
        payment.result_desc = resultDesc || 'Payment failed';
        await payment.save();
        return payment;
    };

    /**
     * Find payment by checkout_request_id (for M-Pesa callback compatibility)
     */
    Payment.findByCheckoutRequestId = async function(checkoutRequestId) {
        return this.findOne({ where: { checkout_request_id: checkoutRequestId } });
    };

    /**
     * Find payment by transaction_id (generic)
     */
    Payment.findByTransactionId = async function(transactionId) {
        return this.findOne({ where: { transaction_id: transactionId } });
    };

    /**
     * Get payment with associated application and user
     */
    Payment.getWithDetails = async function(paymentId) {
        return this.findByPk(paymentId, {
            include: [
                {
                    model: sequelize.models.Application,
                    include: [
                        { model: sequelize.models.User }
                    ]
                }
            ]
        });
    };

    return Payment;
};
