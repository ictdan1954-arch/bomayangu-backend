module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        id_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        county: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        constituency: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    User.associate = (models) => {
        User.hasMany(models.Application, { foreignKey: 'user_id' });
    };

    return User;
};
