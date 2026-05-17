'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');

// ── Import routes ─────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const pageRoutes    = require('./routes/pageRoutes');
const projectRoutes = require('./routes/projectRoutes');

// ── Inisialisasi Express ──────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── View Engine (EJS) ─────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/basecoat', express.static(path.join(__dirname, 'node_modules/basecoat-css/dist')));

// ── Body Parser ───────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fti_secret_dev',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   24 * 60 * 60 * 1000, // 1 hari
  },
}));

// ── Security ──────────────────────────────────────
app.disable('x-powered-by');

// ── Routes ────────────────────────────────────────
app.use('/',             pageRoutes);
app.use('/auth',         authRoutes);
app.use('/api/projects', projectRoutes);

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
});

// ── Global Error Handler ──────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.message);
  res.status(err.status || 500).render('404', { title: 'Kesalahan Server' });
});

// ── Start Server ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
