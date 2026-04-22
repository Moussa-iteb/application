const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user.model');
const Bike = require('./bike.model');

const BikeAssignment = sequelize.define('BikeAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  bikeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bike_id'
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assigned_by'
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  returnedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'returned_at'
  },
  status: {
    type: DataTypes.ENUM('active', 'returned'),
    defaultValue: 'active'
  }
}, {
  tableName: 'bike_assignments',
  timestamps: true,
  underscored: true
});

// ✅ Associations
BikeAssignment.belongsTo(User, { foreignKey: 'user_id' });
BikeAssignment.belongsTo(Bike, { foreignKey: 'bike_id' });

module.exports = BikeAssignment;