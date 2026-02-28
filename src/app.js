require('dotenv').config();

const express = require('express');
const sequelize = require('./models/index');
const { port } = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced');

    app.listen(port, () => {
      console.log(` Server running on http://localhost:${port}`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me     (protected)`);
      console.log(`   POST   /api/auth/logout (protected)`);
    });
  } catch (error) {
    console.error(' Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;