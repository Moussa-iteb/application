const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendNotificationToUser, sendNotificationToAll } = require('../services/notification.service');
const { User } = require('../models');
const { Op } = require('sequelize');

router.post('/send', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    console.log('📩 Payload reçu:', { userId, title, body });

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body required' });
    }

    if (userId) {
      const user = await User.findByPk(userId);
      console.log('👤 User trouvé:', user?.id, 'FCM:', user?.fcm_token);

      if (!user?.fcm_token) {
        return res.status(404).json({ success: false, message: 'User FCM token not found' });
      }

      const result = await sendNotificationToUser(
        user.fcm_token, title, body,
        { userId: String(userId) }
      );
      return res.json({ success: true, ...result });

    } else {
      const users  = await User.findAll({ where: { fcm_token: { [Op.ne]: null } } });
      const tokens = users.map(u => u.fcm_token).filter(Boolean);

      if (!tokens.length) {
        return res.status(404).json({ success: false, message: 'No FCM tokens found' });
      }

      const result = await sendNotificationToAll(tokens, title, body, {});
      return res.json({ success: true, ...result });
    }

  } catch (error) {
    console.error('❌ send error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recent', authenticate, authorize('admin'), async (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;