const User = require('../models/user.model');

class UserService {

  // GET ALL USERS
  async getAllUsers({ page = 1, limit = 100, role, isActive, isBlocked }) {
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

  // UPDATE USER
  async updateUser(id, { username, email, firstName, lastName, role }) {
    const user = await User.findByPk(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // ✅ Construire uniquement les champs fournis
    const updateData = {};
    if (username  && username.trim().length >= 3) updateData.username  = username.trim();
    if (email     && email.trim())                updateData.email     = email.trim();
    if (firstName !== undefined && firstName !== null) updateData.firstName = firstName;
    if (lastName  !== undefined && lastName  !== null) updateData.lastName  = lastName;
    if (role && ['user', 'admin'].includes(role))      updateData.role      = role;

    console.log('📝 Updating user ID:', id, 'with:', updateData);

    await user.update(updateData);
    await user.reload();
    return user;
  }

  // BLOCK / UNBLOCK USER
  async toggleBlockUser(id, blocked) {
    const user = await User.findByPk(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    console.log(`🔒 ${blocked ? 'Blocking' : 'Unblocking'} user ID:`, id);

    await user.update({ isBlocked: blocked });
    await user.reload();
    return user;
  }

  // DELETE USER
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    console.log('🗑️ Deleting user ID:', id);
    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();