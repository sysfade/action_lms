require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

// Initialize SQLite DB
const { initDb } = require('./config/db');
initDb().catch(err => {
  console.error('Fatal: Database initialization failed', err);
  process.exit(1);
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Routes ---

// Health check (Public - must be before authenticate middleware)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'sqlite', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

const courseRoutes = require('./routes/courses');
const authenticate = require('./middleware/authenticate');
app.use('/api/courses', authenticate, courseRoutes);
const lessonRoutes = require('./routes/lessons');
app.use('/api', authenticate, lessonRoutes);
app.use('/api', authenticate, assessmentRoutes);
app.use('/api/upload', authenticate, require('./routes/uploadRoutes'));
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/certificates', authenticate, certificateRoutes);
app.use('/api/xp', require('./routes/xpRoutes'));
app.use('/api', require('./routes/discussionRoutes'));

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LMS backend running on http://localhost:${PORT}`);
});
