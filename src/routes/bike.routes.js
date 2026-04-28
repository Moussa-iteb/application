const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bike.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ← routes ثابتة أولاً
router.post('/scan',         authenticate, bikeController.scanBike);
router.get('/available',     authenticate, bikeController.getAvailableBikes);

// ← routes عامة
router.post('/',             authenticate, bikeController.createBike);
router.get('/',              authenticate, bikeController.getAllBikes);

// ← routes بـ :id أخيراً
router.get('/:id',           authenticate, bikeController.getBikeById);
router.put('/:id',           authenticate, bikeController.updateBike);
router.delete('/:id',        authenticate, bikeController.deleteBike);

module.exports = router;