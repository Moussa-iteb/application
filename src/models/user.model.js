const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'last_name'
  },
  phone: {                          // ← زيدها هنا داخل الـ attributes
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_blocked'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at'
  },
  resetCode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    field: 'reset_code'
  },
  resetCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_code_expires'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

module.exports = User;