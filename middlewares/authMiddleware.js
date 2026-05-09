'use strict';

const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

// ──────────────────────────────────────────────────
// HELPER INTERNAL
// ──────────────────────────────────────────────────

/**
 * Ambil token dari header Authorization (Bearer) ATAU dari cookie.
 * Mendukung dua cara pengiriman token agar fleksibel.
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Fallback: ambil dari cookie bernama 'token'
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

// ──────────────────────────────────────────────────
// MIDDLEWARE 1: verifyToken
// Validasi JWT — wajib dipasang di semua route terproteksi
// ──────────────────────────────────────────────────

/**
 * Middleware untuk memverifikasi JWT.
 * Jika valid, data payload di-attach ke `req.user`.
 * Jika tidak valid / tidak ada, kirim 401.
 */
async function verifyToken(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    // Verifikasi signature & expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek apakah user masih aktif di database
    // (penting: jika akun di-nonaktifkan, token lama harus ditolak)
    const [rows] = await query(
      'SELECT id, email, role_id, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan atau sudah dinonaktifkan.',
      });
    }

    // Attach payload ke request agar bisa dipakai controller berikutnya
    req.user = {
      id     : rows[0].id,
      email  : rows[0].email,
      role_id: rows[0].role_id,
      // role name dari payload (sudah di-set saat login)
      role   : decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
    console.error('[verifyToken]', err);
    return res.status(500).json({ success: false, message: 'Kesalahan server.' });
  }
}

// ──────────────────────────────────────────────────
// MIDDLEWARE 2: authorizeRoles (ACL)
// Harus dipakai SETELAH verifyToken
// ──────────────────────────────────────────────────

/**
 * Factory middleware untuk mengecek role user.
 * Gunakan: authorizeRoles('admin')  atau  authorizeRoles('admin', 'moderator')
 *
 * @param  {...string} allowedRoles - Nama-nama role yang diizinkan
 * @returns {Function} Express middleware
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // verifyToken harus dipanggil lebih dulu
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success : false,
        message : `Akses ditolak. Hanya ${allowedRoles.join(' / ')} yang diizinkan.`,
      });
    }

    next();
  };
}

// ──────────────────────────────────────────────────
// MIDDLEWARE 3: redirectIfAuthenticated
// Untuk halaman login/register agar user yg sudah login
// tidak bisa mengakses kembali
// ──────────────────────────────────────────────────

function redirectIfAuthenticated(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    // Jika token valid, redirect ke dashboard
    return res.redirect('/dashboard');
  } catch {
    next();
  }
}

module.exports = { verifyToken, authorizeRoles, redirectIfAuthenticated };
