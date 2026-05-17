'use strict';

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// POST /login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Email dan password wajib diisi.',
      });
    }

    // Cari user berdasarkan email
    const [rows] = await db.execute(
      'SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    const GENERIC_ERROR = 'Email atau password tidak valid.';

    if (!rows.length) {
      return res.render('auth/login', { title: 'Login', error: GENERIC_ERROR });
    }

    const user = rows[0];

    // Bandingkan password dengan hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { title: 'Login', error: GENERIC_ERROR });
    }

    // Simpan user ke session
    req.session.user = {
      id:    user.id,
      name:  user.name,
      email: user.email,
    };

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('[login]', err);
    return res.render('auth/login', {
      title: 'Login',
      error: 'Kesalahan server. Coba lagi.',
    });
  }
}

// POST /logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
}

module.exports = { login, logout };
