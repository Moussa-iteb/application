const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BikeAssignment = sequelize.define('BikeAssignment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    bikeId: { type: DataTypes.INTEGER, allowNull: false, field: 'bike_id' },
    assignedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'assigned_by' },
    assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'assigned_at' },
    returnedAt: { type: DataTypes.DATE, allowNull: true, field: 'returned_at' },
    status: { type: DataTypes.ENUM('active', 'returned'), defaultValue: 'active' }
  }, {
    tableName: 'bike_assignments',
    timestamps: true,
    underscored: true
  });

  BikeAssignment.associate = (models) => {
    BikeAssignment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    BikeAssignment.belongsTo(models.Bike, { foreignKey: 'bike_id', as: 'bike' });
  };

  return BikeAssignment;
};