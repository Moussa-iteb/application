require('dotenv').config();

const express = require('express');
const sequelize = require('./models/index');
const { port } = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bikeRoutes = require('./routes/bike.routes');
const bikeAssignmentRoutes = require('./routes/bikeAssignment.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bike-assignments', bikeAssignmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database connected and synced');

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me        (protected)`);
      console.log(`   GET    /api/users           (protected)`);
      console.log(`   DELETE /api/users/:id       (protected)`);
      console.log(`   POST   /api/bikes           (protected)`);
      console.log(`   GET    /api/bikes           (protected)`);
      console.log(`   GET    /api/bikes/:id       (protected)`);
      console.log(`   PUT    /api/bikes/:id       (protected)`);
      console.log(`   DELETE /api/bikes/:id       (protected)`);
      console.log(`   POST   /api/bike-assignments           (protected)`);
      console.log(`   GET    /api/bike-assignments           (protected)`);
      console.log(`   GET    /api/bike-assignments/user/:id  (protected)`);
      console.log(`   PUT    /api/bike-assignments/:id/return(protected)`);
      console.log(`   DELETE /api/bike-assignments/:id       (protected)`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;