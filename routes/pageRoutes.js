'use strict';

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

/**
 * Decode JWT dari cookie tanpa throw error.
 * Return null jika token tidak ada / tidak valid.
 */
function decodeUser(req) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────
// GET /  →  redirect ke /login atau /dashboard
// ──────────────────────────────────────────────────
router.get('/', (req, res) => {
  const user = decodeUser(req);
  return user ? res.redirect('/dashboard') : res.redirect('/login');
});

// ──────────────────────────────────────────────────
// GET /login
// ──────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (decodeUser(req)) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: null });
});

// ──────────────────────────────────────────────────
// GET /register
// ──────────────────────────────────────────────────
router.get('/register', (req, res) => {
  if (decodeUser(req)) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register', error: null });
});

// ──────────────────────────────────────────────────
// GET /dashboard  — semua role yang sudah login
// ──────────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const user = decodeUser(req);
  if (!user) return res.redirect('/login');
  res.render('dashboard/index', { title: 'Dashboard', user });
});

// ──────────────────────────────────────────────────
// GET /admin/users  — khusus admin
// ──────────────────────────────────────────────────
router.get('/admin/users', (req, res) => {
  const user = decodeUser(req);
  if (!user) return res.redirect('/login');
  if (user.role !== 'admin') {
    return res.status(403).render('403', { title: 'Akses Ditolak', user });
  }
  res.render('admin/users', { title: 'Kelola Users', user });
});

module.exports = router;
