const express = require('express');
const router = express.Router();
const tripService = require('../services/trip.service');
const { authenticate } = require('../middleware/auth.middleware');

// Créer trip
router.post('/', authenticate, async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (error) { next(error); }
});

// Ajouter user + bike au trip
router.post('/:tripId/users', authenticate, async (req, res, next) => {
  try {
    const { user_id, bike_id } = req.body;
    const tripUser = await tripService.addUserToTrip(
      req.params.tripId,
      user_id,
      bike_id
    );
    res.status(201).json({ success: true, data: tripUser });
  } catch (error) { next(error); }
});

// Démarrer trip
router.put('/:id/start', authenticate, async (req, res, next) => {
  try {
    const trip = await tripService.startTrip(req.params.id);
    res.json({ success: true, data: trip });
  } catch (error) { next(error); }
});

// Terminer trip
router.put('/:id/end', authenticate, async (req, res, next) => {
  try {
    const { end_point_lat, end_point_lng } = req.body;
    const trip = await tripService.endTrip(req.params.id, end_point_lat, end_point_lng);
    res.json({ success: true, data: trip });
  } catch (error) { next(error); }
});

// Ajouter point GPS
router.post('/tracking/:tripUserId', authenticate, async (req, res, next) => {
  try {
    const point = await tripService.addTrackingPoint(req.params.tripUserId, req.body);
    res.status(201).json({ success: true, data: point });
  } catch (error) { next(error); }
});

// Get détails trip
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await tripService.getTripDetails(req.params.id);
    res.json({ success: true, data: trip });
  } catch (error) { next(error); }
});

// Get trips d'un user
router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    const trips = await tripService.getUserTrips(req.params.userId);
    res.json({ success: true, data: trips });
  } catch (error) { next(error); }
});

// Sync offline points
router.post('/sync/tracking', authenticate, async (req, res, next) => {
  try {
    const { points } = req.body;
    const synced = await tripService.syncTrackingPoints(points);
    res.json({ success: true, data: synced });
  } catch (error) { next(error); }
});

module.exports = router;