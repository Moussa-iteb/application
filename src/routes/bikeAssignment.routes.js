const express = require('express');
const router = express.Router();
const bikeAssignmentController = require('../controllers/bikeAssignment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ← routes ثابتة أولاً
router.get('/my/active',        authenticate, bikeAssignmentController.getMyActiveBike);
router.put('/my/return',        authenticate, bikeAssignmentController.returnMyBike);

// ← routes عامة
router.post('/',                authenticate, bikeAssignmentController.assignBike);
router.get('/',                 authenticate, bikeAssignmentController.getAllAssignments);
router.get('/user/:userId',     authenticate, bikeAssignmentController.getUserAssignments);

// ← routes بـ :id أخيراً
router.put('/:id/return',       authenticate, bikeAssignmentController.returnBike);
router.delete('/:id',           authenticate, bikeAssignmentController.deleteAssignment);
router.post('/scan',            authenticate, bikeAssignmentController.scanAndAssignBike);
module.exports = router;