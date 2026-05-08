const { Bike, BikeAssignment, TripUser } = require('../models/index');

const { Op } = require('sequelize');

const bikeAssignmentService = require('./bikeAssignment.service');

class BikeService {

  async createBike(data) {
    const existing = await Bike.findOne({ 
      where: { serialNumber: data.serialNumber } 
    });
    if (existing) {
      throw { status: 409, message: 'Serial number already exists' };
    }
    const bike = await Bike.create(data);
    return bike;
  }

  async getAllBikes({ page = 1, limit = 10, status, isActive }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;

    const { count, rows } = await Bike.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      bikes: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getBikeById(id) {
    const bike = await Bike.findByPk(id);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }
    return bike;
  }

  async updateBike(id, data) {
    const bike = await Bike.findByPk(id);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }
    await bike.update(data);
    return bike;
  }

  async deleteBike(id) {
  const bike = await Bike.findByPk(id);
  if (!bike) {
    throw { status: 404, message: 'Bike not found' };
  }

  try {
    // ✅ snake_case — nom réel de la colonne en DB
    if (TripUser) await TripUser.destroy({ where: { bike_id: id } });
    if (BikeAssignment) await BikeAssignment.destroy({ where: { bike_id: id } });
    await bike.destroy();
    return { message: 'Bike deleted successfully' };
  } catch (err) {
    console.error('DELETE BIKE ERROR:', err.message, err.parent?.detail);
    throw { status: 500, message: err.message };
  }
}

  async getAvailableBikes() {
    const bikes = await Bike.findAll({
      where: { 
        status: 'Available',
        isActive: true
      },
      attributes: ['id', 'model', 'brand', 'serialNumber', 'qrCode', 'status', 'batteryLevel'],
      order: [['createdAt', 'DESC']]
    });
    return bikes;
  }

  async scanBike(qrCode, userId) {
  // ✅ Parse le JSON du QR code
  let bikeId;
  try {
    const parsed = JSON.parse(qrCode);
    bikeId = parsed.bikeId;
  } catch (e) {
    throw { status: 400, message: 'Invalid QR code format' };
  }

  // ✅ Cherche par ID au lieu de qrCode string
  const bike = await Bike.findByPk(bikeId);

  if (!bike) {
    throw { status: 404, message: 'Bike not found' };
  }

  if (bike.status !== 'Available') {
    throw { status: 400, message: 'Bike is not available' };
  }

  const existingUserAssignment = await BikeAssignment.findOne({
    where: { userId, status: 'active' }
  });
  if (existingUserAssignment) {
    throw { status: 400, message: 'You already have an active bike' };
  }

  const existingBikeAssignment = await BikeAssignment.findOne({
    where: { bikeId: bike.id, status: 'active' }
  });
  if (existingBikeAssignment) {
    throw { status: 400, message: 'Bike is already assigned to another user' };
  }

  const assignment = await bikeAssignmentService.assignBike({
    userId,
    bikeId: bike.id,
    assignedBy: userId
  });

  await bike.reload();
  return { bike, assignment };
}}

module.exports = new BikeService();