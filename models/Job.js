module.exports = (sequelize, DataTypes) => {
    const Job = sequelize.define('Job', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique job ID'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Job title cannot be empty'
                },
                len: {
                    args: [1, 255],
                    msg: 'Job title must be between 1 and 255 characters'
                }
            },
            comment: 'Full title of the job position'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the job responsibilities and requirements'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            validate: {
                isIn: {
                    args: [['driver', 'cleaner', 'caretaker', 'security']],
                    msg: 'Category must be one of: driver, cleaner, caretaker, security'
                }
            },
            comment: 'Job category (driver, cleaner, caretaker, security)'
        },
        salary: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [0],
                    msg: 'Salary cannot be negative'
                }
            },
            comment: 'Monthly salary in KES (if fixed)'
        },
        slots: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Number of open slots (number, "Available in Nairobi", or "No more vacant")'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: 'Whether the job is currently open for applications'
        }
    }, {
        tableName: 'jobs',
        timestamps: true,
        underscored: true,          // 🔑 CRITICAL: use snake_case column names
        createdAt: 'created_at',    // explicit mapping (optional but safe)
        updatedAt: 'updated_at',    // explicit mapping (optional but safe)
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['is_active']
            }
        ]
    });

    // ---------- ASSOCIATIONS ----------
    Job.associate = (models) => {
        Job.hasMany(models.Application, { foreignKey: 'job_id' });
    };

    // ---------- HELPER METHODS ----------

    /**
     * Get all active jobs, optionally filtered by category
     * @param {string} category - Optional category filter
     * @returns {Promise<Array>} List of active jobs
     */
    Job.getActive = async function(category = null) {
        const where = { is_active: true };
        if (category) {
            where.category = category;
        }
        return this.findAll({
            where,
            order: [['id', 'ASC']]
        });
    };

    /**
     * Get job with application count
     * @param {number} jobId - The job ID
     * @returns {Promise<Object>} Job with application count
     */
    Job.getWithCount = async function(jobId) {
        const job = await this.findByPk(jobId);
        if (!job) return null;
        const count = await sequelize.models.Application.count({
            where: { job_id: jobId }
        });
        return {
            ...job.toJSON(),
            applicationCount: count
        };
    };

    return Job;
};
