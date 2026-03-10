const express = require('express');
const router = express.Router();

const bikeAssignmentController = require('../controllers/bikeAssignment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes sont protégées par JWT
router.post('/',                    authenticate, bikeAssignmentController.assignBike);
router.get('/',                     authenticate, bikeAssignmentController.getAllAssignments);
router.get('/user/:userId',         authenticate, bikeAssignmentController.getUserAssignments);
router.put('/:id/return',           authenticate, bikeAssignmentController.returnBike);
router.delete('/:id',               authenticate, bikeAssignmentController.deleteAssignment);

module.exports = router;