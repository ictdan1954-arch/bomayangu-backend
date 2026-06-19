module.exports = (sequelize, DataTypes) => {
    const Config = sequelize.define('Config', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'key'  // safe field name
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'config',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: false
    });

    return Config;
};
