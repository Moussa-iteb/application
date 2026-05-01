const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TripTrackingPoint = sequelize.define('TripTrackingPoint', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    trip_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'trip_users', key: 'id' }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    speed_kmh: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    battery_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 100 }
    },
    synced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'trip_tracking_points',
    timestamps: false
  });

  // ✅ Relations
  TripTrackingPoint.associate = (models) => {
    TripTrackingPoint.belongsTo(models.TripUser, {
      foreignKey: 'trip_user_id',
      as: 'tripUser'
    });
  };

  return TripTrackingPoint;
};