module.exports = (sequelize, DataTypes) => {
    const Application = sequelize.define('Application', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique application ID'
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'References the applicant (User)',
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        job_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'References the job position',
            references: {
                model: 'jobs',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        job_title: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Snapshot of the job title at the time of application'
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'pending',
            allowNull: false,
            comment: 'Application status: pending, paid, confirmed, rejected'
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Payment method used: stk_push, manual, etc.'
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Transaction ID from the payment provider (PayHero, M-Pesa, etc.)'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 78.00,
            allowNull: false,
            comment: 'Application fee amount in KES'
        },
        applied_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
            comment: 'Timestamp when the application was created'
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when payment was confirmed (if paid)'
        },
        payment_provider: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Payment provider used: payhero, mpesa, etc.'
        },
        payment_response: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Raw response from the payment provider (optional)'
        }
    }, {
        tableName: 'applications',
        timestamps: true,
        underscored: true,          // 🔑 CRITICAL: use snake_case column names
        createdAt: 'created_at',    // explicit mapping (optional but safe)
        updatedAt: 'updated_at',    // explicit mapping (optional but safe)
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['job_id']
            },
            {
                fields: ['status']
            }
        ]
    });

    // ---------- ASSOCIATIONS ----------
    Application.associate = (models) => {
        // Belongs to a User
        Application.belongsTo(models.User, { foreignKey: 'user_id' });

        // Belongs to a Job
        Application.belongsTo(models.Job, { foreignKey: 'job_id' });

        // Has one Payment record (for storing payment details)
        Application.hasOne(models.Payment, { foreignKey: 'application_id' });
    };

    return Application;
};
