module.exports = (sequelize, DataTypes) => {
    const Config = sequelize.define('Config', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique configuration ID'
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'key',  // 'key' is a reserved word in MySQL, so we map it safely
            validate: {
                notEmpty: {
                    msg: 'Config key cannot be empty'
                },
                len: {
                    args: [1, 100],
                    msg: 'Config key must be between 1 and 100 characters'
                }
            },
            comment: 'Configuration key (e.g., application_fee, paybill_number)'
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                // Optionally, you can add custom validation here
                // e.g., check if value is a valid JSON or number
            },
            comment: 'Configuration value (text, number, JSON, or boolean)'
        }
    }, {
        tableName: 'config',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: false,  // Config values don't need a creation timestamp
        indexes: [
            {
                unique: true,
                fields: ['key']
            }
        ]
    });

    // ---------- HELPER METHODS ----------

    /**
     * Get a config value by key, with optional default
     * @param {string} key - The config key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {Promise<*>} The config value or default
     */
    Config.get = async function(key, defaultValue = null) {
        const record = await this.findOne({ where: { key } });
        if (!record) return defaultValue;
        
        // Try to parse JSON values (for numbers, booleans, objects)
        try {
            return JSON.parse(record.value);
        } catch {
            return record.value;
        }
    };

    /**
     * Set a config value by key (creates or updates)
     * @param {string} key - The config key
     * @param {*} value - The value to store (will be JSON.stringified if object)
     * @returns {Promise<Object>} The updated config record
     */
    Config.set = async function(key, value) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const [record, created] = await this.findOrCreate({
            where: { key },
            defaults: { value: stringValue }
        });
        if (!created) {
            await record.update({ value: stringValue });
        }
        return record;
    };

    /**
     * Get all config values as a single object
     * @returns {Promise<Object>} Key-value pairs
     */
    Config.getAll = async function() {
        const records = await this.findAll();
        const result = {};
        records.forEach(record => {
            try {
                result[record.key] = JSON.parse(record.value);
            } catch {
                result[record.key] = record.value;
            }
        });
        return result;
    };

    return Config;
};
