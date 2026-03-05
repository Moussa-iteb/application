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
      next(error);
    }
  }

  // DELETE /api/users/:id
  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();