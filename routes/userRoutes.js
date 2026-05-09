'use strict';

/**
 * userRoutes.js
 * ─────────────
 * Contoh penggunaan middleware verifyToken + authorizeRoles (ACL).
 *
 * Pola umum:
 *   router.METHOD(path, verifyToken, authorizeRoles('role1','role2'), controller)
 *
 *   • verifyToken      → pastikan request membawa JWT yang valid
 *   • authorizeRoles   → pastikan role user termasuk yang diizinkan
 */

const express = require('express');
const router  = express.Router();

const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { query } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// ROUTE: GET /users
// Hanya ADMIN yang boleh melihat daftar semua user
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin'),          // ← ACL: hanya admin
  async (req, res) => {
    try {
      const [rows] = await query(
        `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
                r.label AS role
         FROM   users u
         JOIN   roles r ON r.id = u.role_id
         ORDER  BY u.created_at DESC`,
        []
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      console.error('[GET /users]', err);
      return res.status(500).json({ success: false, message: 'Kesalahan server.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// ROUTE: GET /users/:id
// Admin bisa lihat siapa saja; user biasa hanya boleh lihat dirinya sendiri
// ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  verifyToken,
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);

      // User biasa hanya boleh akses data dirinya sendiri
      if (req.user.role !== 'admin' && req.user.id !== targetId) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin untuk mengakses data ini.',
        });
      }

      const [rows] = await query(
        `SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.label AS role
         FROM   users u
         JOIN   roles r ON r.id = u.role_id
         WHERE  u.id = ? LIMIT 1`,
        [targetId]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
      console.error('[GET /users/:id]', err);
      return res.status(500).json({ success: false, message: 'Kesalahan server.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// ROUTE: PATCH /users/:id/status
// Hanya ADMIN yang boleh mengaktifkan / menonaktifkan akun
// ─────────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles('admin'),          // ← ACL: hanya admin
  async (req, res) => {
    try {
      const targetId  = parseInt(req.params.id, 10);
      const { is_active } = req.body;

      if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Field is_active harus bernilai true/false atau 1/0.',
        });
      }

      // Cegah admin menonaktifkan akun dirinya sendiri
      if (req.user.id === targetId) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat mengubah status akun sendiri.',
        });
      }

      const [result] = await query(
        'UPDATE users SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, targetId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: `Akun berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
    } catch (err) {
      console.error('[PATCH /users/:id/status]', err);
      return res.status(500).json({ success: false, message: 'Kesalahan server.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// ROUTE: DELETE /users/:id
// Hanya ADMIN yang boleh menghapus user
// ─────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),          // ← ACL: hanya admin
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);

      if (req.user.id === targetId) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus akun diri sendiri.',
        });
      }

      const [result] = await query(
        'DELETE FROM users WHERE id = ?',
        [targetId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'User berhasil dihapus.' });
    } catch (err) {
      console.error('[DELETE /users/:id]', err);
      return res.status(500).json({ success: false, message: 'Kesalahan server.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// ROUTE: GET /users/dashboard (contoh resource untuk semua role)
// Semua user yang login (admin maupun user) bisa akses
// ─────────────────────────────────────────────────────────────
router.get(
  '/info/dashboard',
  verifyToken,
  authorizeRoles('admin', 'user'),  // ← ACL: admin dan user
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: `Selamat datang di dashboard, ${req.user.name}!`,
      data   : { user: req.user },
    });
  }
);

module.exports = router;
