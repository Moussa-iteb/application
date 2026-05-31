const userService = require('../services/user.service');
const { User } = require('../models');
const { Op } = require('sequelize');

class UserController {

  // GET /api/users
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role, isActive, isBlocked } = req.query;
      const result = await userService.getAllUsers({
        page, limit, role, isActive, isBlocked
      });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('❌ getAllUsers error:', error);
      next(error);
    }
  }

  // PUT /api/users/:id
  async updateUser(req, res, next) {
    try {
      const { username, email, firstName, lastName, role, phone } = req.body;
      const result = await userService.updateUser(req.params.id, {
        username, email, firstName, lastName, role, phone
      });
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ updateUser error:', error);
      next(error);
    }
  }

  // PATCH /api/users/:id/block
  async toggleBlockUser(req, res, next) {
    try {
      const { blocked } = req.body;
      const result = await userService.toggleBlockUser(req.params.id, blocked);
      return res.status(200).json({
        success: true,
        message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
        data: result
      });
    } catch (error) {
      console.error('❌ toggleBlockUser error:', error);
      next(error);
    }
  }

  // PUT /api/users/:id/password
  async changePassword(req, res, next) {
    try {
      const result = await userService.changePassword(req.params.id, req.body);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // DELETE /api/users/:id
  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error('❌ deleteUser error:', error);
      next(error);
    }
  }

  // POST /api/users/fcm-token — app mobile
  async saveFcmToken(req, res, next) {
    try {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ success: false, message: 'FCM token required' });
      }

      // ✅ Supprime ce token chez tous les autres utilisateurs
      await User.update(
        { fcm_token: null },
        { where: { fcm_token: fcmToken, id: { [Op.ne]: req.user.id } } }
      );

      // ✅ Sauvegarde pour l'utilisateur connecté
      await User.update(
        { fcm_token: fcmToken },
        { where: { id: req.user.id } }
      );

      console.log(`✅ FCM token saved for user ${req.user.id}, removed from others`);
      return res.status(200).json({ success: true, message: 'FCM token saved' });
    } catch (error) {
      console.error('❌ saveFcmToken error:', error);
      next(error);
    }
  }
}

module.exports = new UserController();