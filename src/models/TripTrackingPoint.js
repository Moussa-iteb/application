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

    // ✅ FLOAT بدل DECIMAL — يرجع number مباشرة مش string
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      get() {
        const val = this.getDataValue('latitude');
        return val !== null && val !== undefined ? parseFloat(val) : null;
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      get() {
        const val = this.getDataValue('longitude');
        return val !== null && val !== undefined ? parseFloat(val) : null;
      }
    },

    recorded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    speed_kmh: {
      type: DataTypes.FLOAT,
      allowNull: true,
      get() {
        const val = this.getDataValue('speed_kmh');
        return val !== null && val !== undefined ? parseFloat(val) : null;
      }
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