const BikeAssignment = require('../models/bikeAssignment.model');
const Bike = require('../models/bike.model');
const User = require('../models/user.model');

class BikeAssignmentService {

  // Assigner un vélo à un utilisateur
  async assignBike({ userId, bikeId, assignedBy }) {

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Vérifier si le vélo existe
    const bike = await Bike.findByPk(bikeId);
    if (!bike) {
      throw { status: 404, message: 'Bike not found' };
    }

    // Vérifier si le vélo est disponible
    if (bike.status !== 'Available') {
      throw { status: 400, message: 'Bike is not available' };
    }

    // Vérifier si le vélo est déjà assigné
    const existing = await BikeAssignment.findOne({
      where: { bikeId, status: 'active' }
    });
    if (existing) {
      throw { status: 409, message: 'Bike already assigned' };
    }

    // Créer l'assignation
    const assignment = await BikeAssignment.create({
      userId,
      bikeId,
      assignedBy,
      assignedAt: new Date()
    });

    // Mettre à jour le statut du vélo
    await bike.update({ status: 'In Use' });

    return assignment;
  }

  // Voir toutes les assignations avec pagination
  async getAllAssignments({ page = 1, limit = 10, status }) {
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await BikeAssignment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['assignedAt', 'DESC']]
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

  // Voir les assignations d'un utilisateur
  async getUserAssignments(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const assignments = await BikeAssignment.findAll({
      where: { userId },
      order: [['assignedAt', 'DESC']]
    });

    return assignments;
  }

  // Retourner un vélo
  async returnBike(assignmentId) {
    const assignment = await BikeAssignment.findByPk(assignmentId);
    if (!assignment) {
      throw { status: 404, message: 'Assignment not found' };
    }

    if (assignment.status === 'returned') {
      throw { status: 400, message: 'Bike already returned' };
    }

    // Mettre à jour l'assignation
    await assignment.update({
      status: 'returned',
      returnedAt: new Date()
    });

    // Remettre le vélo en Available
    await Bike.update(
      { status: 'Available' },
      { where: { id: assignment.bikeId } }
    );

    return assignment;
  }

  // Supprimer une assignation
  async deleteAssignment(id) {
    const assignment = await BikeAssignment.findByPk(id);
    if (!assignment) {
      throw { status: 404, message: 'Assignment not found' };
    }
    await assignment.destroy();
    return { message: 'Assignment deleted successfully' };
  }
}

module.exports = new BikeAssignmentService();