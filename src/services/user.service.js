const User = require('../models/user.model');

class UserService {

  // جلب كل المستخدمين مع pagination
  async getAllUsers({ page = 1, limit = 10, role, isActive, isBlocked }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isBlocked !== undefined) where.isBlocked = isBlocked;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // حذف مستخدم
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();