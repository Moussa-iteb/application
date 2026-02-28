const authService = require('../services/auth.service');

class AuthController {

  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const result = await authService.register({ username, email, password, firstName, lastName });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Delete your token on client side.'
    });
  }
}

module.exports = new AuthController();