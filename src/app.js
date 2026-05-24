require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models/index');
const { port } = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bikeRoutes = require('./routes/bike.routes');
const bikeAssignmentRoutes = require('./routes/bikeAssignment.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const tripRoutes = require('./routes/trip.routes');

const app = express();

// ===== CORS =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bike-assignments', bikeAssignmentRoutes);
app.use('/api/trips', tripRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ Database connected and synced');

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;