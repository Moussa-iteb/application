const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/generateToken');

class AuthService {

  async register({ username, email, password, firstName, lastName }) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw { status: 409, message: 'Email already registered' };
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw { status: 409, message: 'Username already taken' };
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    };
  }

  async login({ email, password }) {
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    if (!user.isActive) {
      throw { status: 403, message: 'Account is deactivated' };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    await user.update({ lastLoginAt: new Date() });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      token
    };
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return user;
  }
}

module.exports = new AuthService();