const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TripUser = sequelize.define('TripUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    trip_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'trips', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    bike_id: {
    type: DataTypes.INTEGER,
    allowNull: true,   // ✅ كان false
    references: { model: 'bikes', key: 'id' }
},
    status: {
  type: DataTypes.ENUM('start', 'active', 'completed', 'cancelled'),
  defaultValue: 'start'
},
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    synced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'trip_users',
    timestamps: false
  });

  // ✅ Relations
  TripUser.associate = (models) => {
    // TripUser → Trip
    TripUser.belongsTo(models.Trip, {
      foreignKey: 'trip_id',
      as: 'trip'
    });

    // TripUser → User
    TripUser.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // TripUser → Bike
    TripUser.belongsTo(models.Bike, {
      foreignKey: 'bike_id',
      as: 'bike'
    });

    // TripUser → TrackingPoints (one to many)
    TripUser.hasMany(models.TripTrackingPoint, {
      foreignKey: 'trip_user_id',
      as: 'trackingPoints'
    });
  };

  return TripUser;
};