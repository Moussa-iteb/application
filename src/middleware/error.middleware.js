const { nodeEnv } = require('../config/config');

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(nodeEnv === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

module.exports = { errorHandler, notFoundHandler };