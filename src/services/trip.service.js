const QRCode = require('qrcode');
const { Trip, TripUser, TripTrackingPoint, User, Bike } = require('../models');

class TripService {

  // ─── Create Trip ──────────────────────────────────────────────────────────

  async createTrip(data) {
    const trip = await Trip.create({
      start_point_lat: data.start_point_lat,
      start_point_lng: data.start_point_lng,
      scheduled_at:    data.scheduled_at,
      status:          'planned'
    });

    const qrData = JSON.stringify({
      tripId:      trip.id,
      startLat:    data.start_point_lat,
      startLng:    data.start_point_lng,
      scheduledAt: data.scheduled_at
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300, margin: 2,
      color: { dark: '#1a8a4a', light: '#ffffff' }
    });

    await trip.update({ qr_code: qrCodeUrl });
    return trip;
  }

  // ─── Add User to Trip ─────────────────────────────────────────────────────

  async addUserToTrip(tripId, userId, bikeId) {
    try {
      const existing = await TripUser.findOne({
        where: { trip_id: tripId, user_id: userId }
      });

      if (existing) {
        const err = new Error('User already in this trip');
        err.status = 409;
        throw err;
      }

      const bikeExists = bikeId ? await Bike.findByPk(bikeId) : null;
      const finalBikeId = bikeExists ? bikeId : null;

      const tripUser = await TripUser.create({
        trip_id:   tripId,
        user_id:   userId,
        bike_id:   finalBikeId,
        status:    'confirmed',
        joined_at: new Date()
      });

      return tripUser;
    } catch (err) {
      console.error('TripUser.create error:', err.message);
      console.error('Original error:', err.original?.message);
      throw err;
    }
  }

  // ─── Scan QR ──────────────────────────────────────────────────────────────

  async scanTripQr(tripId, userId, bikeId = null) {
    const trip = await Trip.findByPk(tripId, {
      include: [{
        model: TripUser,
        as:    'tripUsers',
        include: [
          { model: User, as: 'user' },
          { model: Bike, as: 'bike' }
        ]
      }]
    });

    if (!trip) {
      const err = new Error('Trip not found');
      err.status = 404;
      throw err;
    }

    if (trip.status === 'cancelled') {
      const err = new Error('Trip is cancelled');
      err.status = 400;
      throw err;
    }

    // ✅ completed → امسح كل شيء قديم وابدأ من جديد
    if (trip.status === 'completed') {
      const oldTripUsers = await TripUser.findAll({ where: { trip_id: tripId } });
      for (const tu of oldTripUsers) {
        await TripTrackingPoint.destroy({ where: { trip_user_id: tu.id } });
      }
      await TripUser.destroy({ where: { trip_id: tripId } });

      await trip.update({
        status:      'active',
        ended_at:    null,
        started_at:  new Date(),
        distance_km: 0
      });

      const bikeExists = bikeId ? await Bike.findByPk(bikeId) : null;
      const newTripUser = await TripUser.create({
        trip_id:   tripId,
        user_id:   userId,
        bike_id:   bikeExists ? bikeId : null,
        status:    'confirmed',
        joined_at: new Date()
      });

      return {
        tripUserId: newTripUser.id,
        tripId:     trip.id,
        bikeId:     newTripUser.bike_id,
        bike:       bikeExists || null,
        startLat:   trip.start_point_lat,
        startLng:   trip.start_point_lng,
        startedAt:  new Date()
      };
    }

    // ✅ planned → active
    if (trip.status === 'planned') {
      await trip.update({ status: 'active', started_at: new Date() });
    }

    let tripUser = await TripUser.findOne({
      where: { trip_id: tripId, user_id: userId },
      include: [{ model: Bike, as: 'bike' }]
    });

    if (!tripUser) {
      const err = new Error('You are not assigned to this trip');
      err.status = 403;
      throw err;
    }

    await tripUser.update({ status: 'confirmed', joined_at: new Date() });

    tripUser = await TripUser.findOne({
      where: { trip_id: tripId, user_id: userId },
      include: [{ model: Bike, as: 'bike' }]
    });

    return {
      tripUserId: tripUser.id,
      tripId:     trip.id,
      bikeId:     tripUser.bike_id,
      bike:       tripUser.bike,
      startLat:   trip.start_point_lat,
      startLng:   trip.start_point_lng,
      startedAt:  trip.started_at
    };
  }

  // ─── Generate QR ──────────────────────────────────────────────────────────

  async generateQrCode(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    const qrData = JSON.stringify({
      tripId:      trip.id,
      startLat:    trip.start_point_lat,
      startLng:    trip.start_point_lng,
      scheduledAt: trip.scheduled_at
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300, margin: 2,
      color: { dark: '#1a8a4a', light: '#ffffff' }
    });

    await trip.update({ qr_code: qrCodeUrl });
    return trip;
  }

  // ─── Start Trip ───────────────────────────────────────────────────────────

  async startTrip(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    if (trip.status === 'cancelled') {
      throw new Error('Cannot restart cancelled trip');
    }

    if (trip.status === 'active') {
      return trip;
    }

    await trip.update({
      status:     'active',
      started_at: trip.started_at || new Date(),
      ended_at:   null
    });
    return trip;
  }

  // ─── End Trip ─────────────────────────────────────────────────────────────

  async endTrip(tripId, endLat, endLng) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    const distance = await this.calculateTripDistance(tripId);
    console.log('Distance calculée:', distance);

    await trip.update({
      status:        'completed',
      ended_at:      new Date(),
      end_point_lat: endLat || null,
      end_point_lng: endLng || null,
      distance_km:   parseFloat(distance.toFixed(4))
    });

    await TripUser.update(
      { left_at: new Date() },
      { where: { trip_id: tripId, status: 'confirmed' } }
    );

    return trip;
  }

  // ─── Add Tracking Point ───────────────────────────────────────────────────

  async addTrackingPoint(tripUserId, data) {
    try {
      const tripUser = await TripUser.findByPk(tripUserId);
      if (!tripUser) {
        const err = new Error(`TripUser #${tripUserId} not found`);
        err.status = 404;
        throw err;
      }

      const point = await TripTrackingPoint.create({
        trip_user_id:  tripUserId,
        latitude:      parseFloat(data.latitude),
        longitude:     parseFloat(data.longitude),
        recorded_at:   new Date(),
        speed_kmh:     data.speed_kmh     || null,
        battery_level: data.battery_level || null,
        synced:        false
      });

      console.log(`TRACKING: tripUser=${tripUserId} lat=${data.latitude} lng=${data.longitude}`);
      return point;
    } catch (error) {
      console.error('TRACKING ERROR:', error.message);
      console.error('DETAIL:', error.original?.detail);
      throw error;
    }
  }

  // ─── Calculate Distance ───────────────────────────────────────────────────

  async calculateTripDistance(tripId) {
    const tripUsers = await TripUser.findAll({
      where: { trip_id: tripId },
      include: [{
        model:    TripTrackingPoint,
        as:       'trackingPoints',
        separate: true,
        order:    [['recorded_at', 'ASC']]
      }]
    });

    console.log('TripUsers found:', tripUsers.length);

    let totalDistance = 0;

    for (const tripUser of tripUsers) {
      const points = tripUser.trackingPoints || [];
      console.log(`  TripUser #${tripUser.id}: ${points.length} points`);

      for (let i = 1; i < points.length; i++) {
        const lat1 = parseFloat(points[i - 1].latitude);
        const lng1 = parseFloat(points[i - 1].longitude);
        const lat2 = parseFloat(points[i].latitude);
        const lng2 = parseFloat(points[i].longitude);

        if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) continue;
        if (lat1 === lat2 && lng1 === lng2) continue;

        const d = this.haversineDistance(lat1, lng1, lat2, lng2);
        console.log(`  Point ${i-1}→${i}: (${lat1},${lng1})→(${lat2},${lng2}) = ${d.toFixed(4)} km`);
        totalDistance += d;
      }
    }

    const result = Math.round(totalDistance * 10000) / 10000;
    console.log('Total distance:', result, 'km');
    return result;
  }

  // ─── Haversine Formula ────────────────────────────────────────────────────

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ─── Get Details ──────────────────────────────────────────────────────────

  async getTripDetails(tripId) {
    return await Trip.findByPk(tripId, {
      include: [{
        model: TripUser,
        as:    'tripUsers',
        include: [
          { model: User,              as: 'user',           attributes: ['id', 'username', 'email'] },
          { model: Bike,              as: 'bike',           attributes: ['id', 'model', 'brand', 'batteryLevel'] },
          { model: TripTrackingPoint, as: 'trackingPoints', separate: true, order: [['recorded_at', 'ASC']] }
        ]
      }]
    });
  }

  // ─── Get All Trips ────────────────────────────────────────────────────────

  async getAllTrips() {
    return await Trip.findAll({
      include: [{
        model: TripUser,
        as:    'tripUsers',
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
          { model: Bike, as: 'bike', attributes: ['id', 'model', 'brand'] }
        ]
      }],
      order: [['created_at', 'DESC']]
    });
  }

  // ─── Get User Trips ───────────────────────────────────────────────────────

  async getUserTrips(userId) {
    return await Trip.findAll({
      include: [{
        model: TripUser,
        as:    'tripUsers',
        where: { user_id: userId },
        include: [{ model: Bike, as: 'bike' }]
      }],
      order: [['created_at', 'DESC']]
    });
  }

  // ─── Delete Trip ──────────────────────────────────────────────────────────

  async deleteTrip(id) {
    const trip = await Trip.findByPk(id);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    const tripUsers = await TripUser.findAll({ where: { trip_id: id } });
    for (const tu of tripUsers) {
      await TripTrackingPoint.destroy({ where: { trip_user_id: tu.id } });
    }
    await TripUser.destroy({ where: { trip_id: id } });
    await trip.destroy();
    return true;
  }

  // ─── Sync Offline Points ──────────────────────────────────────────────────

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

  // ─── Cancel Trip ──────────────────────────────────────────────────────────

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