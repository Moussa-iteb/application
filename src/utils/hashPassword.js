const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/config');

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(bcryptRounds);
  return bcrypt.hash(plainPassword, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };