const bikeService = require('../services/bike.service');

class BikeController {

  // POST /api/bikes
  async createBike(req, res, next) {
    try {
      const bike = await bikeService.createBike(req.body);
      return res.status(201).json({
        success: true,
        message: 'Bike created successfully',
        data: { bike }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bikes
  async getAllBikes(req, res, next) {
    try {
      const { page, limit, status, isActive } = req.query;
      const result = await bikeService.getAllBikes({ 
        page, limit, status, isActive 
      });
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bikes/:id
  async getBikeById(req, res, next) {
    try {
      const bike = await bikeService.getBikeById(req.params.id);
      return res.status(200).json({
        success: true,
        data: { bike }
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bikes/:id
  async updateBike(req, res, next) {
    try {
      const bike = await bikeService.updateBike(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Bike updated successfully',
        data: { bike }
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bikes/:id
  async deleteBike(req, res, next) {
    try {
      const result = await bikeService.deleteBike(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BikeController();