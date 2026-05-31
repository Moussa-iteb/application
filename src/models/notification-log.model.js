// models/notification-log.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('NotificationLog', {
    title:        { type: DataTypes.STRING,                   allowNull: false },
    body:         { type: DataTypes.TEXT },
    target:       { type: DataTypes.ENUM('all', 'user'),      defaultValue: 'all' },
    userId:       { type: DataTypes.INTEGER,                  allowNull: true },
    successCount: { type: DataTypes.INTEGER,                  defaultValue: 0 },
    failureCount: { type: DataTypes.INTEGER,                  defaultValue: 0 },
    totalReached: { type: DataTypes.INTEGER,                  defaultValue: 0 },
  }, {
    tableName: 'NotificationLogs',
    timestamps: true,
  });
};