const express = require('express');
const router = express.Router();

const bikeController = require('../controllers/bike.controller');
const { authenticate } = require('../middleware/auth.middleware');

// كل الـ routes محمية بـ JWT
router.post('/',      authenticate, bikeController.createBike);
router.get('/',       authenticate, bikeController.getAllBikes);
router.get('/:id',    authenticate, bikeController.getBikeById);
router.put('/:id',    authenticate, bikeController.updateBike);
router.delete('/:id', authenticate, bikeController.deleteBike);

module.exports = router;