const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  /\.railway\.app$/,
  /\.vercel\.app$/,
  /\.onrender\.com$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = process.env.NODE_ENV === 'production'
      ? allowedOrigins.some(o => typeof o === 'string' ? origin === o : o.test(origin))
      : [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/].some(rx => rx.test(origin));
    callback(null, allowed);
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/stats',    require('./routes/stats'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Ethara Team Task Manager API', timestamp: new Date() })
);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!DB_URI) {
  console.error('❌ Missing database connection string. Set MONGODB_URI in backend/.env.');
  process.exit(1);
}

mongoose.connect(DB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch(err => { console.error('❌ DB Error:', err.message); process.exit(1); });