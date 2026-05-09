'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

// ──────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────

/**
 * POST /auth/register
 * Body: { name, email, password }
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validasi input dasar
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    }

    // Validasi panjang password minimum
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 8 karakter.',
      });
    }

    // 2. Cek apakah email sudah terdaftar (menggunakan prepared statement → aman dari SQL Injection)
    const [existing] = await query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    // 3. Hash password dengan bcrypt (JANGAN simpan plain text)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Ambil role_id default ('user')
    const [roleRows] = await query(
      "SELECT id FROM roles WHERE name = 'user' LIMIT 1",
      []
    );

    if (!roleRows.length) {
      return res.status(500).json({
        success: false,
        message: 'Konfigurasi role tidak ditemukan. Hubungi administrator.',
      });
    }

    const roleId = roleRows[0].id;

    // 5. Simpan user baru ke database
    const [result] = await query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, roleId]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan login.',
      data   : { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim() },
    });

  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Kesalahan server saat registrasi.' });
  }
}

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
    const GENERIC_ERROR = 'Email atau password salah.';

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

module.exports = { register, login, logout, getProfile };
