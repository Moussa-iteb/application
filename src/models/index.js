const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect,
    logging: config.logging,
    dialectOptions: config.dialectOptions
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging
    }
  );
}

const User               = require('./user.model')(sequelize);
const Bike               = require('./bike.model')(sequelize);
const BikeAssignment     = require('./bikeAssignment.model')(sequelize);
const Trip               = require('./Trip')(sequelize);
const TripUser           = require('./TripUser')(sequelize);
const TripTrackingPoint  = require('./TripTrackingPoint')(sequelize);
const NotificationLog    = require('./notification-log.model')(sequelize); // ✅ ajoute

const models = { User, Bike, BikeAssignment, Trip, TripUser, TripTrackingPoint, NotificationLog };

Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

module.exports = { sequelize, ...models };