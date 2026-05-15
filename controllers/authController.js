'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

// ──────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────

/**
 * POST /auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    // 2. Cari user berdasarkan email (JOIN dengan roles untuk ambil nama role)
    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.password, u.is_active,
              r.name AS role_name, r.id AS role_id
       FROM   users u
       JOIN   roles r ON r.id = u.role_id
       WHERE  u.email = ?
       LIMIT  1`,
      [email.toLowerCase().trim()]
    );

    // 3. Pesan error generik agar attacker tidak tahu apakah email terdaftar
    const GENERIC_ERROR = 'Email atau sandi tidak valid.';

    if (!rows.length) {
      return res.status(401).json({ success: false, message: GENERIC_ERROR });
    }

    const user = rows[0];

    // 4. Cek akun aktif
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan.' });
    }

    // 5. Bandingkan password dengan hash bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: GENERIC_ERROR });
    }

    // 6. Buat JWT payload (jangan masukkan data sensitif!)
    const payload = {
      id   : user.id,
      name : user.name,
      email: user.email,
      role : user.role_name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    // 7. Kirim token via cookie HttpOnly (lebih aman dari localStorage)
    res.cookie('token', token, {
      httpOnly: true,                                       // tidak bisa diakses JavaScript browser
      secure  : process.env.NODE_ENV === 'production',     // hanya HTTPS di production
      sameSite: 'strict',
      maxAge  : 24 * 60 * 60 * 1000,                       // 1 hari dalam ms
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data   : {
        token, // juga kirim di body untuk keperluan API client (opsional)
        user  : { id: user.id, name: user.name, email: user.email, role: user.role_name },
      },
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Kesalahan server saat login.' });
  }
}

// ──────────────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────────────

/**
 * POST /auth/logout
 * Hapus cookie token dari browser.
 */
function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout berhasil.' });
}

// ──────────────────────────────────────────────────
// GET PROFILE (contoh endpoint terproteksi)
// ──────────────────────────────────────────────────

/**
 * GET /auth/me
 * Kembalikan data user yang sedang login (dari req.user).
 * Route ini harus diproteksi dengan verifyToken.
 */
async function getProfile(req, res) {
  try {
    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.created_at, r.label AS role
       FROM   users u
       JOIN   roles r ON r.id = u.role_id
       WHERE  u.id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[getProfile]', err);
    return res.status(500).json({ success: false, message: 'Kesalahan server.' });
  }
}

module.exports = { login, logout, getProfile };
