const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation, validate } = require('../validators/auth.validator');

// Public
router.post('/register', registerValidation, validate, authController.register);
router.post('/login',    loginValidation,    validate, authController.login);        // ← web admin
router.post('/login/user', loginValidation,  validate, authController.loginUser);   // ← mobile users

// Protected
router.get('/me',      authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);

// Forgot/Reset password — admin web seulement
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Forgot/Reset password — mobile users seulement
router.post('/forgot-password/user', authController.forgotPasswordUser);
router.post('/reset-password/user',  authController.resetPasswordUser);

module.exports = router;