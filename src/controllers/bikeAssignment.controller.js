const bikeAssignmentService = require('../services/bikeAssignment.service');
const Bike = require('../models/bike.model');
const BikeAssignment = require('../models/bikeAssignment.model');
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
  async returnMyBike(req, res, next) {
    try {
        const userId = req.user.id;
        const assignment = await BikeAssignment.findOne({
            where: { userId, status: 'active' }
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'No active bike found'
            });
        }

        await assignment.update({
            status: 'returned',
            returnedAt: new Date()
        });

        await Bike.update(
            { status: 'Available' },
            { where: { id: assignment.bikeId } }
        );

        return res.status(200).json({
            success: true,
            message: 'Bike returned successfully'
        });
    } catch (error) {
        next(error);
    }
}
async getMyActiveBike(req, res, next) {
    try {
        const userId = req.user.id;
        const assignment = await BikeAssignment.findOne({
            where: { userId, status: 'active' },
            include: [{ model: Bike }]
        });

        if (!assignment) {
            return res.status(200).json({
                success: false,
                message: 'No active bike'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Active bike found',
            data: {
                bike: assignment.Bike,
                assignment: assignment
            }
        });
    } catch (error) {
        next(error);
    }
}
}

module.exports = new BikeAssignmentController();