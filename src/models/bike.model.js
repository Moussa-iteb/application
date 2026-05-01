const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bike = sequelize.define('Bike', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    serialNumber: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: 'serial_number' },
    model: { type: DataTypes.STRING(100), allowNull: false },
    brand: { type: DataTypes.STRING(100), allowNull: false },
    qrCode: { type: DataTypes.STRING(255), allowNull: true, unique: true, field: 'qr_code' },
    imei: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
    lastLocationUpdate: { type: DataTypes.DATE, allowNull: true, field: 'last_location_update' },
    batteryLevel: { type: DataTypes.INTEGER, allowNull: true, field: 'battery_level', validate: { min: 0, max: 100 } },
    batteryHealth: { type: DataTypes.STRING(50), allowNull: true, field: 'battery_health' },
    motorStatus: { type: DataTypes.STRING(50), allowNull: true, field: 'motor_status' },
    status: { type: DataTypes.ENUM('Available', 'In Use', 'Maintenance', 'Offline'), defaultValue: 'Available' },
    isLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_locked' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    lastMaintenanceDate: { type: DataTypes.DATE, allowNull: true, field: 'last_maintenance_date' },
    nextMaintenanceDate: { type: DataTypes.DATE, allowNull: true, field: 'next_maintenance_date' },
    totalDistance: { type: DataTypes.FLOAT, defaultValue: 0, field: 'total_distance' },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'bikes',
    timestamps: true,
    underscored: true
  });

  Bike.associate = (models) => {
    Bike.belongsToMany(models.Trip, {
      through: models.TripUser,
      foreignKey: 'bike_id',
      as: 'trips'
    });
    Bike.hasMany(models.BikeAssignment, {
      foreignKey: 'bike_id',
      as: 'assignments'
    });
  };

  return Bike;
};