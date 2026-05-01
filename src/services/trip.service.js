const { Trip, TripUser, TripTrackingPoint, User, Bike } = require('../models');
const { Op } = require('sequelize');

class TripService {

  // ✅ Créer un trip
  async createTrip(data) {
    const trip = await Trip.create({
      start_point_lat: data.start_point_lat,
      start_point_lng: data.start_point_lng,
      scheduled_at: data.scheduled_at,
      status: 'planned'
    });
    return trip;
  }

  // ✅ Ajouter user + bike à un trip
  async addUserToTrip(tripId, userId, bikeId) {
    const tripUser = await TripUser.create({
      trip_id: tripId,
      user_id: userId,
      bike_id: bikeId,
      status: 'confirmed',
      joined_at: new Date()
    });
    return tripUser;
  }

  // ✅ Démarrer un trip
  async startTrip(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.status !== 'planned') throw new Error('Trip already started');

    await trip.update({
      status: 'active',
      started_at: new Date()
    });

    return trip;
  }

  // ✅ Terminer un trip
  async endTrip(tripId, endLat, endLng) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    // ✅ Calculer distance avant de terminer
    const distance = await this.calculateTripDistance(tripId);
    console.log('Distance calculée:', distance); // ← ajoute ce log

    await trip.update({
      status: 'completed',
      ended_at: new Date(),
      end_point_lat: endLat,
      end_point_lng: endLng,
      distance_km: distance
    });

    await TripUser.update(
      { left_at: new Date() },
      { where: { trip_id: tripId, status: 'confirmed' } }
    );

    return trip;
}

  // ✅ Ajouter point GPS
  async addTrackingPoint(tripUserId, data) {
  try {
    const point = await TripTrackingPoint.create({
      trip_user_id: tripUserId,
      latitude: data.latitude,
      longitude: data.longitude,
      recorded_at: new Date(),
      speed_kmh: data.speed_kmh || null,
      battery_level: data.battery_level || null,
      synced: false
    });
    return point;
  } catch (error) {
    console.error('TRACKING ERROR:', error.message);
    console.error('DETAIL:', error.original?.detail);
    throw error;
  }
}

  // ✅ Calculer distance via points GPS
  async calculateTripDistance(tripId) {
    const tripUsers = await TripUser.findAll({
      where: { trip_id: tripId },
      include: [{
        model: TripTrackingPoint,
        as: 'trackingPoints',
        order: [['recorded_at', 'ASC']]
      }]
    });

    console.log('TripUsers found:', tripUsers.length);
    console.log('Points:', tripUsers[0]?.trackingPoints?.length);

    let totalDistance = 0;
    for (const tripUser of tripUsers) {
      const points = tripUser.trackingPoints;
      for (let i = 1; i < points.length; i++) {
        totalDistance += this.haversineDistance(
          points[i-1].latitude, points[i-1].longitude,
          points[i].latitude, points[i].longitude
        );
      }
    }
    return Math.round(totalDistance * 100) / 100;
}
  // ✅ Formule Haversine — distance entre 2 points GPS
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ✅ Get trip avec tous les détails
  async getTripDetails(tripId) {
    return await Trip.findByPk(tripId, {
      include: [
        {
          model: TripUser,
          as: 'tripUsers',
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
            { model: Bike, as: 'bike', attributes: ['id', 'model', 'brand', 'batteryLevel'] },
            {
              model: TripTrackingPoint,
              as: 'trackingPoints',
              order: [['recorded_at', 'ASC']]
            }
          ]
        }
      ]
    });
  }

  // ✅ Get trips d'un user
  async getUserTrips(userId) {
    return await Trip.findAll({
      include: [{
        model: TripUser,
        as: 'tripUsers',
        where: { user_id: userId },
        include: [
          { model: Bike, as: 'bike' }
        ]
      }],
      order: [['created_at', 'DESC']]
    });
  }

  // ✅ Sync points offline
  async syncTrackingPoints(points) {
    const created = await TripTrackingPoint.bulkCreate(points, {
      ignoreDuplicates: true
    });

    await TripTrackingPoint.update(
      { synced: true },
      { where: { id: created.map(p => p.id) } }
    );

    return created;
  }

  // ✅ Annuler un trip
  async cancelTrip(tripId) {
    await Trip.update(
      { status: 'cancelled' },
      { where: { id: tripId } }
    );

    await TripUser.update(
      { status: 'cancelled' },
      { where: { trip_id: tripId } }
    );
  }
}

module.exports = new TripService();