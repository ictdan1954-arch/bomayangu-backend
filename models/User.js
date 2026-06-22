module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: 'Unique user ID'
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Full name cannot be empty'
                },
                len: {
                    args: [1, 255],
                    msg: 'Full name must be between 1 and 255 characters'
                }
            },
            comment: 'Applicant or admin full name'
        },
        id_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: 'ID number cannot be empty'
                },
                is: {
                    args: /^[0-9]{5,12}$/,
                    msg: 'ID number must be 5 to 12 digits'
                }
            },
            comment: 'National ID or passport number'
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Phone number cannot be empty'
                },
                is: {
                    args: /^[0-9]{9,12}$/,
                    msg: 'Phone number must be 9 to 12 digits'
                }
            },
            comment: 'Phone number (raw, without country code)'
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: {
                    msg: 'Invalid email format'
                }
            },
            comment: 'Email address (optional)'
        },
        county: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'County of residence'
        },
        constituency: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Constituency of residence'
        },
        // ---------- Admin fields (for authentication) ----------
        role: {
            type: DataTypes.STRING(50),
            defaultValue: 'user',
            validate: {
                isIn: {
                    args: [['user', 'admin']],
                    msg: 'Role must be either "user" or "admin"'
                }
            },
            comment: 'User role: user or admin'
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Hashed password (only for admin users)'
        }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['id_number']
            },
            {
                fields: ['phone']
            },
            {
                fields: ['email']
            },
            {
                fields: ['county']
            },
            {
                fields: ['constituency']
            }
        ]
    });

    // ---------- ASSOCIATIONS ----------
    User.associate = (models) => {
        User.hasMany(models.Application, { foreignKey: 'user_id' });
    };

    // ---------- HELPER METHODS ----------

    /**
     * Find a user by ID number
     */
    User.findByIdNumber = async function(idNumber) {
        return this.findOne({ where: { id_number: idNumber } });
    };

    /**
     * Find a user by phone number
     */
    User.findByPhone = async function(phone) {
        return this.findOne({ where: { phone } });
    };

    /**
     * Find or create a user from application data
     */
    User.findOrCreateFromApplication = async function(data) {
        const { fullName, idNumber, phone, email, county, constituency } = data;
        let user = await this.findByIdNumber(idNumber);
        if (!user) {
            user = await this.create({
                full_name: fullName,
                id_number: idNumber,
                phone,
                email,
                county,
                constituency
            });
        } else {
            // Update user details if they've changed
            await user.update({
                full_name: fullName,
                phone,
                email,
                county,
                constituency
            });
        }
        return user;
    };

    /**
     * Get admin user (used in auth controller)
     */
    User.getAdmin = async function() {
        return this.findOne({ where: { role: 'admin' } });
    };

    return User;
};
