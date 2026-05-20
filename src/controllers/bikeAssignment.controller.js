const { Bike, BikeAssignment } = require('../models/index');
const bikeAssignmentService = require('../services/bikeAssignment.service');

class BikeAssignmentController {

  async getAllAssignments({ page = 1, limit = 100, status } = {}) {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await BikeAssignment.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      { model: Bike, as: 'bike', attributes: ['id', 'serialNumber', 'brand', 'model'] }
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

  async returnBike(req, res, next) {
    try {
      const assignment = await bikeAssignmentService.returnBike(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Bike returned successfully',
        data: { assignment }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAssignment(req, res, next) {
    try {
      const result = await bikeAssignmentService.deleteAssignment(req.params.id);
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

  async assignBike(req, res, next) {
  try {
    const { userId, bikeId, tripId } = req.body;  // ✅ ajoute tripId
    const assignedBy = req.user.id;

    const result = await bikeAssignmentService.assignBike({
      userId, bikeId, assignedBy, tripId  // ✅ passe tripId
    });

    return res.status(201).json({
      success: true,
      message: 'Bike assigned successfully',
      data: {
        assignment: result.assignment,
        trip: result.trip,
        qrCode: result.qrCode
      }
    });
  } catch (error) {
    next(error);
  }
}
  async scanAndAssignBike(req, res, next) {
    try {
      const { qrCode } = req.body;
      const userId = req.user.id;

      // parse الـ QR code
      let bikeId;
      try {
        const parsed = JSON.parse(qrCode);
        bikeId = parsed.bikeId;
      } catch (e) {
        bikeId = qrCode;
      }

      // تحقق إذا الـ bike available
      const bike = await Bike.findOne({
        where: { id: bikeId, status: 'Available' }
      });

      if (!bike) {
        return res.status(404).json({
          success: false,
          message: 'Bike not available'
        });
      }

      // تحقق إذا المستخدم عنده bike active
      const existingAssignment = await BikeAssignment.findOne({
        where: { userId, status: 'active' }
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active bike'
        });
      }

      // assign الـ bike
      const assignment = await BikeAssignment.create({
        userId,
        bikeId,
        assignedBy: userId,
        status: 'active',
        assignedAt: new Date()
      });

      await Bike.update(
        { status: 'In Use' },
        { where: { id: bikeId } }
      );

      return res.status(200).json({
        success: true,
        message: 'Bike assigned successfully',
        data: {
          bike: bike,
          assignment: assignment
        }
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
      include: [{ 
        model: Bike, 
        as: 'bike'  // ✅ alias obligatoire
      }]
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
        bike: assignment.bike,  // ✅ minuscule — correspond à l'alias
        assignment: assignment
      }
    });
  } catch (error) {
    next(error);
  }
}
}

module.exports = new BikeAssignmentController();