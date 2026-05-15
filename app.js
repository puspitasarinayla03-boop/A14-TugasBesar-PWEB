
'use strict';

require('dotenv').config();

const express      = require('express');
const cookieParser = require('cookie-parser');
const path         = require('path');

// ── Import routes ─────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pageRoutes = require('./routes/pageRoutes');

// ── Inisialisasi Express ──────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── View Engine (EJS) ─────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/basecoat', express.static(path.join(__dirname, 'node_modules/basecoat-css/dist')));

// ── Global Middleware ─────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Security ──────────────────────────────────────
app.disable('x-powered-by');

// ── Page Routes (HTML/EJS) — harus sebelum API ───
app.use('/', pageRoutes);

// ── API Routes (JSON) ─────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

// ── Health check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
  }
  // Untuk request halaman, render view 404
  res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
});

// ── Global Error Handler ──────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.message);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Terjadi kesalahan server.',
    });
  }
  res.status(500).render('404', { title: 'Kesalahan Server' });
});

// ── Start Server ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
