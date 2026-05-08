const { BikeAssignment, Bike, User, Trip, TripUser } = require('../models/index');
const QRCode = require('qrcode');

class BikeAssignmentService {

  async assignBike({ userId, bikeId, assignedBy }) {
    const user = await User.findByPk(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const bike = await Bike.findByPk(bikeId);
    if (!bike) throw { status: 404, message: 'Bike not found' };

    if (bike.status !== 'Available')
      throw { status: 400, message: 'Bike is not available' };

    // إنهاء كل assignments قديمة للـ user
    const oldAssignments = await BikeAssignment.findAll({
      where: { userId, status: 'active' }
    });
    for (const old of oldAssignments) {
      await Bike.update(
        { status: 'Available' },
        { where: { id: old.bikeId } }
      );
      await old.update({ status: 'returned', returnedAt: new Date() });
    }

    // إنهاء كل trips قديمة للـ user
    const oldTripUsers = await TripUser.findAll({
      where: { user_id: userId, status: 'confirmed' }
    });
    for (const oldTU of oldTripUsers) {
      await oldTU.update({ status: 'cancelled', left_at: new Date() });
      await Trip.update(
        { status: 'completed', ended_at: new Date() },
        { where: { id: oldTU.trip_id, status: ['planned', 'active'] } }
      );
    }

    // خلق assignment جديد
    const assignment = await BikeAssignment.create({
      userId, bikeId, assignedBy, assignedAt: new Date()
    });

    // خلق trip جديد
    const trip = await Trip.create({
      start_point_lat: 0,
      start_point_lng: 0,
      status: 'planned',
      scheduled_at: new Date()
    });

    // خلق tripUser
    await TripUser.create({
      trip_id: trip.id,
      user_id: userId,
      bike_id: bikeId,
      status: 'confirmed',
      joined_at: new Date()
    });

    // توليد QR Code
    const qrData = JSON.stringify({
      tripId: trip.id,
      userId,
      bikeId,
      assignedAt: new Date()
    });
    const qrCode = await QRCode.toDataURL(qrData);
    await trip.update({ qr_code: qrCode });

    // تحديث status الـ bike
    await bike.update({ status: 'In Use' });

    return { assignment, trip, qrCode };
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

    await assignment.update({
      status: 'returned',
      returnedAt: new Date()
    });

    await Bike.update(
      { status: 'Available' },
      { where: { id: assignment.bikeId } }
    );

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
    data: {
      bike: assignment.bike
    }
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