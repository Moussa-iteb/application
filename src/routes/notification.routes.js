const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { sendNotificationToUser, sendNotificationToAll } = require('../services/notification.service');
const { User } = require('../models');

// إرسال لـ user واحد
router.post('/send', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body required' });
    }

    if (userId) {
      // إرسال لـ user محدد
      const user = await User.findByPk(userId);
      if (!user?.fcm_token) {
        return res.status(404).json({ success: false, message: 'User FCM token not found' });
      }
      const result = await sendNotificationToUser(user.fcm_token, title, body, data || {});
      res.json(result);
    } else {
      // broadcast لكل الـ users
      const users = await User.findAll({
        where: { fcm_token: { [require('sequelize').Op.ne]: null } }
      });
      const tokens = users.map(u => u.fcm_token).filter(Boolean);
      if (!tokens.length) {
        return res.status(404).json({ success: false, message: 'No FCM tokens found' });
      }
      const result = await sendNotificationToAll(tokens, title, body, data || {});
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;