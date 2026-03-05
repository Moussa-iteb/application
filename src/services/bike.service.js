const Bike = require('../models/bike.model');
const { Op } = require('sequelize');

class BikeService {

  // 
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

  // 
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

  // 
  async getBikeById(id) {
    const bike = await Bike.findByPk(id);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }
    return bike;
  }

  // 
  async updateBike(id, data) {
    const bike = await Bike.findByPk(id);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }
    await bike.update(data);
    return bike;
  }

  // 
  async deleteBike(id) {
    const bike = await Bike.findByPk(id);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }
    await bike.destroy();
    return { message: 'Bike deleted successfully' };
  }
}

module.exports = new BikeService();