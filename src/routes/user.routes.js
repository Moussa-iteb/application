const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/',      authenticate, userController.getAllUsers);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;