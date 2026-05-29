const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendNotificationToUser, sendNotificationToAll } = require('../services/notification.service');
const { User } = require('../models');
const { Op } = require('sequelize');

router.post('/send', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body required' });
    }

    if (userId) {
      const user = await User.findByPk(userId);
      if (!user?.fcm_token) {
        return res.status(404).json({ success: false, message: 'User FCM token not found' });
      }
      const result = await sendNotificationToUser(user.fcm_token, title, body, data || {});
      return res.json(result);
    } else {
      const users = await User.findAll({
        where: { fcm_token: { [Op.ne]: null } }
      });
      const tokens = users.map(u => u.fcm_token).filter(Boolean);
      if (!tokens.length) {
        return res.status(404).json({ success: false, message: 'No FCM tokens found' });
      }
      const result = await sendNotificationToAll(tokens, title, body, data || {});
      return res.json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;