const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendNotificationToUser, sendNotificationToAll } = require('../services/notification.service');
const { User } = require('../models');
const { Op } = require('sequelize');

router.post('/send', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    console.log('📩 Payload reçu:', { userId, title, body }); // ← debug

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body required' });
    }

    if (userId) {
      // ✅ Envoi à UN seul utilisateur
      const user = await User.findByPk(userId);
      console.log('👤 User trouvé:', user?.id, 'FCM:', user?.fcm_token);

      if (!user?.fcm_token) {
        return res.status(404).json({ success: false, message: 'User FCM token not found' });
      }

      const result = await sendNotificationToUser(user.fcm_token, title, body, data || {});

      await NotificationLog.create({
        title, body,
        target: 'user',
        userId: userId,
        successCount: 1,
        failureCount: 0,
        totalReached: 1,
      });

      return res.json({ success: true, ...result });

    } else {
      // ✅ Envoi à TOUS les utilisateurs
      const users  = await User.findAll({ where: { fcm_token: { [Op.ne]: null } } });
      const tokens = users.map(u => u.fcm_token).filter(Boolean);

      if (!tokens.length) {
        return res.status(404).json({ success: false, message: 'No FCM tokens found' });
      }

      const result = await sendNotificationToAll(tokens, title, body, data || {});

      await NotificationLog.create({
        title, body,
        target: 'all',
        userId: null,
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalReached: result.successCount,
      });

      return res.json({ success: true, ...result });
    }

  } catch (error) {
    console.error('❌ send error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;