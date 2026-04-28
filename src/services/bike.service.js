const Bike = require('../models/bike.model');
const { Op } = require('sequelize');
const BikeAssignment = require('../models/bikeAssignment.model');
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
    await bike.destroy();
    return { message: 'Bike deleted successfully' };
  }

  // ← نسخة واحدة فقط — 'Available' بحرف كبير
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
    console.log('QR Code received:', qrCode);
    const bike = await Bike.findOne({ where: { qrCode } });

    if (!bike) {
        throw { status: 404, message: 'Bike not available' };
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

    const assignment = await bikeAssignmentService.assignBike({
        userId,
        bikeId: bike.id,
        assignedBy: userId
    });

    // ← reload bike بعد update
    await bike.reload();

    return { bike, assignment };
}
}

module.exports = new BikeService();