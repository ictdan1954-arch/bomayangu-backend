module.exports = (sequelize, DataTypes) => {
    const Job = sequelize.define('Job', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        salary: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        slots: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'jobs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Job.associate = (models) => {
        Job.hasMany(models.Application, { foreignKey: 'job_id' });
    };

    return Job;
};
