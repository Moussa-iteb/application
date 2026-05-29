const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/',             authenticate, userController.getAllUsers);
router.put('/:id',          authenticate, userController.updateUser);
router.patch('/:id/block',  authenticate, userController.toggleBlockUser);
router.delete('/:id',       authenticate, userController.deleteUser);
router.put('/:id/password', authenticate, userController.changePassword);

module.exports = router;