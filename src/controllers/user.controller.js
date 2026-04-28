const userService = require('../services/user.service');

class UserController {

  // GET /api/users
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role, isActive, isBlocked } = req.query;
      const result = await userService.getAllUsers({
        page, limit, role, isActive, isBlocked
      });
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ getAllUsers error:', error);
      next(error);
    }
  }

  // PUT /api/users/:id
  async updateUser(req, res, next) {
    try {
      const { username, email, firstName, lastName, role } = req.body;

      console.log('📥 PUT /users/:id →', req.params.id, req.body);

      const result = await userService.updateUser(req.params.id, {
        username, email, firstName, lastName, role
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

      console.log('📥 PATCH /users/:id/block →', req.params.id, { blocked });

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
async changePassword(req, res) {
  try {
    const result = await userService.changePassword(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}
  // DELETE /api/users/:id
  async deleteUser(req, res, next) {
    try {
      console.log('📥 DELETE /users/:id →', req.params.id);

      const result = await userService.deleteUser(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ deleteUser error:', error);
      next(error);
    }
  }
}

module.exports = new UserController();