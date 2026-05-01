const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Trip = sequelize.define('Trip', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    start_point_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    start_point_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    end_point_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    end_point_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    distance_km: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'trips',
    timestamps: false
  });

  // ✅ Relations
  Trip.associate = (models) => {
    // Trip → TripUser (one to many)
    Trip.hasMany(models.TripUser, {
      foreignKey: 'trip_id',
      as: 'tripUsers'
    });

    // Trip → Users via TripUser (many to many)
    Trip.belongsToMany(models.User, {
      through: models.TripUser,
      foreignKey: 'trip_id',
      otherKey: 'user_id',
      as: 'users'
    });

    // Trip → Bikes via TripUser (many to many)
    Trip.belongsToMany(models.Bike, {
      through: models.TripUser,
      foreignKey: 'trip_id',
      otherKey: 'bike_id',
      as: 'bikes'
    });
  };

  return Trip;
};