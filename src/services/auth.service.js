const { User } = require('../models/index');
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

    if (!user) throw { status: 401, message: 'Invalid credentials' };

    // ✅ Utilise comparePassword au lieu de bcrypt.compare
    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw { status: 401, message: 'Invalid credentials' };

    // ✅ Vérifier que c'est un admin
    if (user.role !== 'admin') {
      throw { status: 403, message: 'Access denied. Admins only.' };
    }

    if (user.isBlocked) {
      throw { status: 403, message: 'Your account has been blocked.' };
    }

    // ✅ Utilise generateToken au lieu de jwt.sign
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }
async loginUser({ email, password }) {
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) throw { status: 401, message: 'Invalid credentials' };

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw { status: 401, message: 'Invalid credentials' };

    // users seulement — admin ممنوع
    if (user.role === 'admin') {
      throw { status: 403, message: 'Access denied. Admins only on web.' };
    }

    if (user.isBlocked) {
      throw { status: 403, message: 'Your account has been blocked.' };
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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