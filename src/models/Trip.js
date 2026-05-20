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
      allowNull: true   // ✅ null — pas obligatoire à la création
    },
    start_point_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true   // ✅ null
    },
    end_point_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    end_point_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    // ✅ Nouveaux champs adresse
    start_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination_address: {
      type: DataTypes.STRING(255),
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
      type: DataTypes.DECIMAL(10, 4),  // ✅ 4 décimales
      defaultValue: 0
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'trips',
    timestamps: false
  });

  Trip.associate = (models) => {
    Trip.hasMany(models.TripUser, {
      foreignKey: 'trip_id',
      as: 'tripUsers'
    });
    Trip.belongsToMany(models.User, {
      through: models.TripUser,
      foreignKey: 'trip_id',
      otherKey: 'user_id',
      as: 'users'
    });
    Trip.belongsToMany(models.Bike, {
      through: models.TripUser,
      foreignKey: 'trip_id',
      otherKey: 'bike_id',
      as: 'bikes'
    });
  };

  return Trip;
};