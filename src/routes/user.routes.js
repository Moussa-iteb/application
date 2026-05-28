const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/',                authenticate, userController.getAllUsers);
router.put('/:id',             authenticate, userController.updateUser);
router.patch('/:id/block',     authenticate, userController.toggleBlockUser);
router.delete('/:id',          authenticate, userController.deleteUser);
router.put('/:id/password',    authenticate, userController.changePassword);
router.post('/profile/photo',  authenticate, upload.single('photo'), userController.uploadPhoto);  // ← جديد

module.exports = router;