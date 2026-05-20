const authService = require('../services/auth.service');
const { sendResetCode } = require('../services/email.service');
const { User } = require('../models'); // ✅ fix ici
const bcrypt = require('bcrypt');

class AuthController {

  // ✅ Register
  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const result = await authService.register({
        username, email, password, firstName, lastName
      });
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Login — web admin seulement
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

  // ✅ Login — mobile users seulement
  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser({ email, password });
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Get Profile
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

  // ✅ Logout
  logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Delete your token on client side.'
    });
  }

  // ✅ Forgot Password — admin web seulement
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await user.update({ resetCode: code, resetCodeExpires: expires });
      await sendResetCode(email, code);

      return res.status(200).json({ message: 'Reset code sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Reset Password — admin web seulement
  async resetPassword(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      if (String(user.resetCode).trim() !== String(code).trim()) {
        return res.status(400).json({ message: 'Invalid code' });
      }

      if (new Date() > new Date(user.resetCodeExpires)) {
        return res.status(400).json({ message: 'Code expired' });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await user.update({
        password: hashed,
        resetCode: null,
        resetCodeExpires: null
      });

      return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Forgot Password — mobile users seulement
  async forgotPasswordUser(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await user.update({ resetCode: code, resetCodeExpires: expires });
      await sendResetCode(email, code);

      return res.status(200).json({ message: 'Reset code sent to your email' });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Reset Password — mobile users seulement
  async resetPasswordUser(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
      }

      if (String(user.resetCode).trim() !== String(code).trim()) {
        return res.status(400).json({ message: 'Invalid code' });
      }

      if (new Date() > new Date(user.resetCodeExpires)) {
        return res.status(400).json({ message: 'Code expired' });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await user.update({
        password: hashed,
        resetCode: null,
        resetCodeExpires: null
      });

      return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();