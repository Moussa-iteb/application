const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation, validate } = require('../validators/auth.validator');

// Public
router.post('/register', registerValidation, validate, authController.register);
router.post('/login',    loginValidation,    validate, authController.login);

// Protected
router.get('/me',      authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;