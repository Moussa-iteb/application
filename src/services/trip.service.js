const QRCode = require('qrcode');
const { Trip, TripUser, TripTrackingPoint, User, Bike, BikeAssignment } = require('../models');

class TripService {

  // ─── Calculate Distance From Tracking Points ──────────────────────────────────
  calculateDistance(points) {
    if (!points || points.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const lat1 = parseFloat(points[i-1].latitude);
      const lng1 = parseFloat(points[i-1].longitude);
      const lat2 = parseFloat(points[i].latitude);
      const lng2 = parseFloat(points[i].longitude);
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    return Math.round(total * 100) / 100;
  }

  // ─── Create Trip ──────────────────────────────────────────────────────────────
  async createTrip(data) {
    const trip = await Trip.create({
      start_address: data.start_address,
      destination_address: data.destination_address,
      start_point_lat: data.start_point_lat || 0,
      start_point_lng: data.start_point_lng || 0,
      scheduled_at: data.scheduled_at || null,
      status: 'planned',
    });
    return trip;
  }

  // ─── Get All Trips ────────────────────────────────────────────────────────────
  async getAllTrips() {
    const trips = await Trip.findAll({
      include: [
        {
          model: TripUser,
          as: 'tripUsers',
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
            { model: Bike, as: 'bike', attributes: ['id', 'brand', 'model', 'status'] },
            { model: TripTrackingPoint, as: 'trackingPoints' },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return trips;
  }

  // ─── Get Trip Details ─────────────────────────────────────────────────────────
  async getTripDetails(tripId) {
    const trip = await Trip.findByPk(tripId, {
      include: [
        {
          model: TripUser,
          as: 'tripUsers',
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
            { model: Bike, as: 'bike', attributes: ['id', 'brand', 'model', 'status'] },
            { model: TripTrackingPoint, as: 'trackingPoints' },
          ],
        },
      ],
    });
    if (!trip) throw { status: 404, message: 'Trip not found' };
    return trip;
  }

  // ─── Get Trip By Id (alias) ───────────────────────────────────────────────────
  async getTripById(tripId) {
    return this.getTripDetails(tripId);
  }

  // ─── Get User Trips ───────────────────────────────────────────────────────────
  async getUserTrips(userId) {
    const tripUsers = await TripUser.findAll({
      where: { user_id: Number(userId) },
      include: [
        {
          model: Trip,
          as: 'trip',
          include: [
            {
              model: TripUser,
              as: 'tripUsers',
              include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
                { model: Bike, as: 'bike', attributes: ['id', 'brand', 'model', 'status'] },
                { model: TripTrackingPoint, as: 'trackingPoints' },
              ],
            },
          ],
        },
      ],
      order: [['joined_at', 'DESC']],
    });
    return tripUsers.map(tu => tu.trip).filter(Boolean);
  }

  // ─── Add User To Trip ─────────────────────────────────────────────────────────
  async addUserToTrip(tripId, userId, bikeId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    const existing = await TripUser.findOne({
      where: { trip_id: Number(tripId), user_id: Number(userId) },
    });
    if (existing) return existing;

    const tripUser = await TripUser.create({
      trip_id: Number(tripId),
      user_id: Number(userId),
      bike_id: bikeId ? Number(bikeId) : null,
      status: 'start',
      joined_at: new Date(),
    });
    return tripUser;
  }

  // ─── Delete Trip ──────────────────────────────────────────────────────────────
  async deleteTrip(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };
    await TripUser.destroy({ where: { trip_id: Number(tripId) } });
    await trip.destroy();
    return { message: 'Trip deleted successfully' };
  }

  // ─── Cancel Trip ──────────────────────────────────────────────────────────────
  async cancelTrip(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    if (trip.status === 'cancelled')
      throw { status: 400, message: 'Trip is already cancelled' };
    if (trip.status === 'completed')
      throw { status: 400, message: 'Cannot cancel a completed trip' };

    await trip.update({ status: 'cancelled' });

    const tripUsers = await TripUser.findAll({ where: { trip_id: Number(tripId) } });
    for (const tu of tripUsers) {
      await tu.update({ status: 'cancelled', left_at: new Date() });

      if (tu.bike_id && tu.user_id) {
        const assignment = await BikeAssignment.findOne({
          where: {
            userId: Number(tu.user_id),
            bikeId: Number(tu.bike_id),
            status: 'active',
          },
        });
        if (assignment) {
          await assignment.update({ status: 'returned', returnedAt: new Date() });
        }
        await Bike.update(
          { status: 'Available' },
          { where: { id: Number(tu.bike_id) } }
        );
      }
    }
    return { message: 'Trip cancelled and bike(s) released successfully' };
  }

  // ─── Start Trip ───────────────────────────────────────────────────────────────
  async startTrip(tripId, userId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    if (trip.status !== 'active') {
      await trip.update({ status: 'active', started_at: new Date() });
    }

    if (userId) {
      const tripUser = await TripUser.findOne({
        where: { trip_id: Number(tripId), user_id: Number(userId) }
      });
      if (tripUser && (tripUser.status === 'start' || tripUser.status === 'confirmed')) {
        await tripUser.update({ status: 'active' });
        if (tripUser.bike_id) {
          await Bike.update({ status: 'In Use' }, { where: { id: Number(tripUser.bike_id) } });
        }
      }
    }

    return trip;
  }

  // ─── Cancel TripUser ──────────────────────────────────────────────────────────
  async cancelTripUser(tripId, userId) {
    const tripUser = await TripUser.findOne({
      where: { trip_id: Number(tripId), user_id: Number(userId) }
    });
    if (!tripUser) throw { status: 404, message: 'TripUser not found' };

    await tripUser.update({ status: 'cancelled', left_at: new Date() });

    if (tripUser.bike_id) {
      await Bike.update(
        { status: 'Available' },
        { where: { id: Number(tripUser.bike_id) } }
      );
      const assignment = await BikeAssignment.findOne({
        where: { userId: Number(userId), bikeId: Number(tripUser.bike_id), status: 'active' }
      });
      if (assignment) {
        await assignment.update({ status: 'returned', returnedAt: new Date() });
      }
    }

    const allUsers = await TripUser.findAll({ where: { trip_id: Number(tripId) } });
    const allDone = allUsers.every(tu => tu.status === 'completed' || tu.status === 'cancelled');
    if (allDone) {
      await Trip.update(
        { status: 'cancelled', ended_at: new Date() },
        { where: { id: Number(tripId) } }
      );
    }

    return tripUser;
  }

  // ─── Get My Active Trip ───────────────────────────────────────────────────────
  async getMyActiveTrip(userId) {
    const tripUser = await TripUser.findOne({
      where: { user_id: userId, status: ['start', 'active'] },
      order: [['id', 'DESC']]
    });

    if (!tripUser) return null;

    return {
      id: tripUser.trip_id,
      status: tripUser.status,
      tripUsers: [{ id: tripUser.id, userId: tripUser.user_id }]
    };
  }

  // ─── Complete Individual TripUser ─────────────────────────────────────────────
  async completeTripUser(tripId, userId) {
    const tripUser = await TripUser.findOne({
      where: { trip_id: Number(tripId), user_id: Number(userId) }
    });
    if (!tripUser) throw { status: 404, message: 'TripUser not found' };

    if (tripUser.status !== 'completed' && tripUser.status !== 'cancelled') {
      await tripUser.update({ status: 'completed', left_at: new Date() });
    }

    // ✅ حساب distance من tracking points
    const points = await TripTrackingPoint.findAll({
      where: { trip_user_id: tripUser.id },
      order: [['recorded_at', 'ASC']]
    });
    const distanceKm = this.calculateDistance(points);
    if (distanceKm > 0) {
      await Trip.update(
        { distance_km: distanceKm },
        { where: { id: Number(tripId) } }
      );
    }

    if (tripUser.bike_id) {
      await Bike.update(
        { status: 'Available' },
        { where: { id: Number(tripUser.bike_id) } }
      );
      const assignment = await BikeAssignment.findOne({
        where: {
          userId: Number(userId),
          bikeId: Number(tripUser.bike_id),
          status: 'active'
        }
      });
      if (assignment) {
        await assignment.update({ status: 'returned', returnedAt: new Date() });
      }
    }

    const allUsers = await TripUser.findAll({ where: { trip_id: Number(tripId) } });
    const allDone = allUsers.every(tu =>
      tu.status === 'completed' || tu.status === 'cancelled'
    );
    if (allDone) {
      const trip = await Trip.findByPk(tripId);
      if (trip && trip.status !== 'completed') {
        await trip.update({ status: 'completed', ended_at: new Date() });
      }
    }

    return tripUser;
  }

  // ─── End Trip ─────────────────────────────────────────────────────────────────
  async endTrip(tripId, end_point_lat, end_point_lng, userId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    if (userId) {
      const tripUser = await TripUser.findOne({
        where: { trip_id: Number(tripId), user_id: Number(userId) }
      });
      if (tripUser && tripUser.status !== 'completed' && tripUser.status !== 'cancelled') {
        await tripUser.update({ status: 'completed', left_at: new Date() });
      }

      // ✅ حساب distance من tracking points
      if (tripUser) {
        const points = await TripTrackingPoint.findAll({
          where: { trip_user_id: tripUser.id },
          order: [['recorded_at', 'ASC']]
        });
        const distanceKm = this.calculateDistance(points);
        if (distanceKm > 0) {
          await trip.update({ distance_km: distanceKm });
        }
      }

      if (tripUser?.bike_id) {
        await Bike.update({ status: 'Available' }, { where: { id: Number(tripUser.bike_id) } });
        const assignment = await BikeAssignment.findOne({
          where: { userId: Number(userId), bikeId: Number(tripUser.bike_id), status: 'active' }
        });
        if (assignment) {
          await assignment.update({ status: 'returned', returnedAt: new Date() });
        }
      }
    }

    await trip.update({
      end_point_lat: end_point_lat || null,
      end_point_lng: end_point_lng || null,
    });

    const allUsers = await TripUser.findAll({ where: { trip_id: Number(tripId) } });
    const allDone = allUsers.every(tu => tu.status === 'completed' || tu.status === 'cancelled');
    if (allDone) {
      await trip.update({ status: 'completed', ended_at: new Date() });
    }

    return trip;
  }

  // ─── Generate QR Code ─────────────────────────────────────────────────────────
  async generateQrCode(tripId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    const qrCode = await QRCode.toDataURL(
      JSON.stringify({ tripId: Number(tripId) }),
      { width: 250, margin: 2 }
    );
    await trip.update({ qr_code: qrCode });
    return trip;
  }

  // ─── Scan Trip QR ─────────────────────────────────────────────────────────────
  async scanTripQr(tripId, userId, bikeId) {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw { status: 404, message: 'Trip not found' };

    let tripUser = await TripUser.findOne({
      where: { trip_id: Number(tripId), user_id: Number(userId) }
    });

    if (!tripUser) {
      tripUser = await TripUser.create({
        trip_id: Number(tripId),
        user_id: Number(userId),
        bike_id: bikeId ? Number(bikeId) : null,
        status: trip.status === 'active' ? 'active' : 'start',
        joined_at: new Date()
      });
    } else if (tripUser.status === 'start' && trip.status === 'active') {
      await tripUser.update({ status: 'active' });
    }

    return { trip, tripUser };
  }

  // ─── Add Tracking Point ───────────────────────────────────────────────────────
  async addTrackingPoint(tripUserId, data) {
    const tripUser = await TripUser.findByPk(tripUserId);
    if (!tripUser) throw { status: 404, message: 'TripUser not found' };

    const point = await TripTrackingPoint.create({
      trip_user_id: Number(tripUserId),
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed || 0,
      recorded_at: data.recorded_at || new Date(),
    });
    return point;
  }

  // ─── Sync Tracking Points ─────────────────────────────────────────────────────
  async syncTrackingPoints(points) {
    if (!Array.isArray(points) || points.length === 0) return [];

    const created = [];
    for (const p of points) {
      try {
        const point = await TripTrackingPoint.create({
          trip_user_id: Number(p.trip_user_id),
          latitude: p.latitude,
          longitude: p.longitude,
          speed: p.speed || 0,
          recorded_at: p.recorded_at || new Date(),
        });
        created.push(point);
      } catch (e) {
        console.error('Sync point error:', e.message);
      }
    }
    return created;
  }
}

module.exports = new TripService();