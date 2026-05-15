'use strict';

/**
 * userRoutes.js
 * ─────────────
 * Rute untuk manajemen pengguna. 
 * Semua logika database telah dipindahkan ke controllers/userController.js
 */

const express = require('express');
const router  = express.Router();

const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// ─────────────────────────────────────────────────────────────
// GET /users
// Hanya ADMIN yang boleh melihat daftar semua user
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  userController.getAllUsers
);

// ─────────────────────────────────────────────────────────────
// GET /users/:id
// Admin bisa lihat siapa saja; user biasa hanya boleh lihat dirinya sendiri
// ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  verifyToken,
  userController.getUserById
);

// ─────────────────────────────────────────────────────────────
// PATCH /users/:id/status
// Hanya ADMIN yang boleh mengaktifkan / menonaktifkan akun
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles('admin'),
  userController.updateUserStatus
);

// ─────────────────────────────────────────────────────────────
// DELETE /users/:id
// Hanya ADMIN yang boleh menghapus user
// ─────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  userController.deleteUser
);

// ─────────────────────────────────────────────────────────────
// GET /info/dashboard
// Semua user yang login (admin maupun user) bisa akses
// ─────────────────────────────────────────────────────────────
router.get(
  '/info/dashboard',
  verifyToken,
  authorizeRoles('admin', 'user'),
  userController.getDashboardInfo
);

module.exports = router;
