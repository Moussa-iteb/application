const bcrypt = require('bcrypt');
const { User, BikeAssignment, Bike } = require('../models/index');

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

  // CHANGE PASSWORD
  async changePassword(id, { currentPassword, newPassword }) {
    const user = await User.scope('withPassword').findByPk(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw { status: 400, message: 'Current password is incorrect' };

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
    return { message: 'Password changed successfully' };
  }

  // UPDATE USER
  async updateUser(id, { username, email, firstName, lastName, role, phone }) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const updateData = {};
    if (username && username.trim().length >= 3) updateData.username = username.trim();
    if (email && email.trim()) updateData.email = email.trim();
    if (firstName !== undefined && firstName !== null) updateData.firstName = firstName;
    if (lastName !== undefined && lastName !== null) updateData.lastName = lastName;
    if (role && ['user', 'admin'].includes(role)) updateData.role = role;
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
    updateData.phone = phone.trim();

    await user.update(updateData);
    await user.reload();
    return user;
  }

  // BLOCK / UNBLOCK USER
  async toggleBlockUser(id, blocked) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: 'User not found' };

    await user.update({ isBlocked: blocked });
    await user.reload();
    return user;
  }

  // DELETE USER
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const activeAssignments = await BikeAssignment.findAll({
      where: { userId: id, status: 'active' }
    });

    for (const assignment of activeAssignments) {
      await Bike.update(
        { status: 'Available' },
        { where: { id: assignment.bikeId } }
      );
    }

    await BikeAssignment.destroy({ where: { userId: id } });
    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();