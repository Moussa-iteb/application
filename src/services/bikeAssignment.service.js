const { BikeAssignment, Bike, User } = require('../models/index');

class BikeAssignmentService {

  async assignBike({ userId, bikeId, assignedBy }) {
    const user = await User.findByPk(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const bike = await Bike.findByPk(bikeId);
    if (!bike) throw { status: 404, message: 'Bike not found' };

    if (bike.status !== 'Available') throw { status: 400, message: 'Bike is not available' };

    const existing = await BikeAssignment.findOne({
      where: { bikeId: bikeId, status: 'active' }
    });
    if (existing) throw { status: 409, message: 'Bike already assigned' };

    const assignment = await BikeAssignment.create({
      userId,
      bikeId,
      assignedBy,
      assignedAt: new Date()
    });

    await bike.update({ status: 'In Use' });
    return assignment;
  }

  // ✅ getAllAssignments avec User et Bike inclus
  async getAllAssignments({ page = 1, limit = 100, status } = {}) {
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await BikeAssignment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        },
        {
          model: Bike,
          attributes: ['id', 'serialNumber', 'brand', 'model']
        }
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
    if (assignment.status === 'returned') throw { status: 400, message: 'Bike already returned' };

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

  async deleteAssignment(id) {
    const assignment = await BikeAssignment.findByPk(id);
    if (!assignment) throw { status: 404, message: 'Assignment not found' };
    await assignment.destroy();
    return { message: 'Assignment deleted successfully' };
  }
}

module.exports = new BikeAssignmentService();