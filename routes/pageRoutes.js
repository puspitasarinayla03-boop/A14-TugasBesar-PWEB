'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

const { isAuthenticated, redirectIfAuthenticated } = require('../middlewares/authMiddleware');

// GET /
router.get('/', redirectIfAuthenticated, (req, res) => {
  res.redirect('/login');
});

// GET /login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

// GET /dashboard — query stats project dari DB
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        COUNT(*)                AS total,
        SUM(status = 'aktif')   AS aktif,
        SUM(status = 'pending') AS pending,
        SUM(status = 'selesai') AS selesai
       FROM projects`
    );
    res.render('dashboard/index', {
      title:       'Dashboard',
      user:        req.session.user,
      currentPage: 'dashboard',
      stats:       rows[0],
    });
  } catch (err) {
    console.error('[dashboard]', err);
    res.render('dashboard/index', {
      title:       'Dashboard',
      user:        req.session.user,
      currentPage: 'dashboard',
      stats:       { total: 0, aktif: 0, pending: 0, selesai: 0 },
    });
  }
});

// ── Halaman Project (data dimuat via fetch ke /api/projects) ──

// GET /projects
router.get('/projects', isAuthenticated, (req, res) => {
  res.render('projects/index', {
    title:       'Manajemen Project',
    user:        req.session.user,
    currentPage: 'projects',
  });
});

// GET /projects/create  — harus SEBELUM /:id agar tidak tertangkap
router.get('/projects/create', isAuthenticated, (req, res) => {
  res.render('projects/create', {
    title:       'Tambah Project',
    user:        req.session.user,
    currentPage: 'projects',
  });
});

// GET /projects/:id/edit
router.get('/projects/:id/edit', isAuthenticated, (req, res) => {
  res.render('projects/edit', {
    title:       'Edit Project',
    user:        req.session.user,
    currentPage: 'projects',
    projectId:   req.params.id,
  });
});

// GET /projects/:id
router.get('/projects/:id', isAuthenticated, (req, res) => {
  res.render('projects/show', {
    title:       'Detail Project',
    user:        req.session.user,
    currentPage: 'projects',
    projectId:   req.params.id,
  });
});

module.exports = router;
