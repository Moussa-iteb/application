const bikeAssignmentService = require('../services/bikeAssignment.service');

class BikeAssignmentController {

  // POST /api/bike-assignments
  async assignBike(req, res, next) {
    try {
      const { userId, bikeId } = req.body;
      const assignedBy = req.user.id;

      const assignment = await bikeAssignmentService.assignBike({
        userId,
        bikeId,
        assignedBy
      });

      return res.status(201).json({
        success: true,
        message: 'Bike assigned successfully',
        data: { assignment }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bike-assignments
  async getAllAssignments(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await bikeAssignmentService.getAllAssignments({
        page, limit, status
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bike-assignments/user/:userId
  async getUserAssignments(req, res, next) {
    try {
      const assignments = await bikeAssignmentService.getUserAssignments(
        req.params.userId
      );

      return res.status(200).json({
        success: true,
        data: { assignments }
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bike-assignments/:id/return
  async returnBike(req, res, next) {
    try {
      const assignment = await bikeAssignmentService.returnBike(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message: 'Bike returned successfully',
        data: { assignment }
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bike-assignments/:id
  async deleteAssignment(req, res, next) {
    try {
      const result = await bikeAssignmentService.deleteAssignment(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BikeAssignmentController();