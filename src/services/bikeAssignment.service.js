const { BikeAssignment, Bike, User, Trip, TripUser } = require('../models/index');
const QRCode = require('qrcode');

class BikeAssignmentService {

  async assignBike({ userId, bikeId, assignedBy, tripId }) {
    const user = await User.findByPk(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const bike = await Bike.findByPk(bikeId);
    if (!bike) throw { status: 404, message: 'Bike not found' };

    if (bike.status !== 'Available')
      throw { status: 400, message: 'Bike is not available' };

    const oldAssignments = await BikeAssignment.findAll({
      where: { userId, status: 'active' }
    });
    for (const old of oldAssignments) {
      await Bike.update({ status: 'Available' }, { where: { id: old.bikeId } });
      await old.update({ status: 'returned', returnedAt: new Date() });
    }

    const oldTripUsers = await TripUser.findAll({
      where: { user_id: userId, status: ['start', 'active'] }
    });
    for (const oldTU of oldTripUsers) {
      await oldTU.update({ status: 'cancelled', left_at: new Date() });
      await Trip.update(
        { status: 'completed', ended_at: new Date() },
        { where: { id: oldTU.trip_id, status: ['planned', 'active'] } }
      );
    }

    const assignment = await BikeAssignment.create({
      userId, bikeId, assignedBy,
      assignedAt: new Date(),
      status: 'active'
    });

    let trip;

    if (tripId) {
      const sourceTrip = await Trip.findByPk(tripId);
      if (!sourceTrip) throw { status: 404, message: 'Trip not found' };

      // remet la trip à planned si completed/cancelled
      if (sourceTrip.status === 'completed' || sourceTrip.status === 'cancelled') {
        await sourceTrip.update({ status: 'planned', ended_at: null });
      }

      trip = sourceTrip;

      const existing = await TripUser.findOne({
        where: { trip_id: trip.id, user_id: userId }
      });

      if (!existing) {
        await TripUser.create({
          trip_id: trip.id,
          user_id: userId,
          bike_id: bikeId,
          status: trip.status === 'active' ? 'active' : 'start',
          joined_at: new Date()
        });
      } else if (existing.status === 'completed' || existing.status === 'cancelled') {
        await existing.update({ status: 'start', left_at: null });
      }

    } else {
      trip = await Trip.create({
        start_point_lat: 0,
        start_point_lng: 0,
        status: 'planned',
        scheduled_at: new Date()
      });
      await TripUser.create({
        trip_id: trip.id,
        user_id: userId,
        bike_id: bikeId,
        status: 'start',
        joined_at: new Date()
      });
      const qrData = JSON.stringify({ tripId: trip.id, userId, bikeId, assignedAt: new Date() });
      const qrCode = await QRCode.toDataURL(qrData);
      await trip.update({ qr_code: qrCode });
    }

    await bike.update({ status: 'In Use' });
    return { assignment, trip, qrCode: trip.qr_code };
  }

  async getAllAssignments({ page = 1, limit = 100, status } = {}) {
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await BikeAssignment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Bike, attributes: ['id', 'serialNumber', 'brand', 'model'] }
      ],
      order: [['assignedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      assignments: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getUserAssignments(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    return await BikeAssignment.findAll({
      where: { userId },
      include: [
        { model: Bike, attributes: ['id', 'serialNumber', 'brand', 'model'] }
      ],
      order: [['assignedAt', 'DESC']]
    });
  }

  async returnBike(assignmentId) {
    const assignment = await BikeAssignment.findByPk(assignmentId);
    if (!assignment) throw { status: 404, message: 'Assignment not found' };
    if (assignment.status === 'returned')
      throw { status: 400, message: 'Bike already returned' };

    await assignment.update({ status: 'returned', returnedAt: new Date() });
    await Bike.update({ status: 'Available' }, { where: { id: assignment.bikeId } });

    return assignment;
  }

  async getMyActiveBike(userId) {
    const assignment = await BikeAssignment.findOne({
      where: { userId, status: 'active' },
      include: [
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'serialNumber', 'brand', 'model', 'batteryLevel', 'status']
        }
      ],
      order: [['assignedAt', 'DESC']]
    });

    if (!assignment) return null;

    return {
      success: true,
      data: { bike: assignment.bike }
    };
  }

  async deleteAssignment(id) {
    const assignment = await BikeAssignment.findByPk(id);
    if (!assignment) throw { status: 404, message: 'Assignment not found' };
    await assignment.destroy();
    return { message: 'Assignment deleted successfully' };
  }
}

module.exports = new BikeAssignmentService();