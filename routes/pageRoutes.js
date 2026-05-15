'use strict';

const express = require('express');
const router  = express.Router();
const { verifyToken, authorizeRoles, redirectIfAuthenticated } = require('../middlewares/authMiddleware');

// ──────────────────────────────────────────────────
// GET /  →  redirect ke /login atau /dashboard
// ──────────────────────────────────────────────────
router.get('/', redirectIfAuthenticated, (req, res) => {
  // Jika belum login (melewati redirectIfAuthenticated), redirect ke login
  res.redirect('/login');
});

// ──────────────────────────────────────────────────
// GET /login
// ──────────────────────────────────────────────────
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

// ──────────────────────────────────────────────────
// GET /dashboard  — semua role yang sudah login
// ──────────────────────────────────────────────────
router.get('/dashboard', verifyToken, (req, res) => {
  // req.user di-set oleh verifyToken
  res.render('dashboard/index', { title: 'Dashboard', user: req.user });
});

// ──────────────────────────────────────────────────
// GET /admin/users  — khusus admin
// ──────────────────────────────────────────────────
router.get('/admin/users', verifyToken, authorizeRoles('admin'), (req, res) => {
  // Hanya akan dirender jika verifyToken sukses dan role == admin
  res.render('admin/users', { title: 'Kelola Users', user: req.user });
});

module.exports = router;
