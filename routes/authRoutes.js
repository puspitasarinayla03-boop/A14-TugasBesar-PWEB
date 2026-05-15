'use strict';

const express = require('express');
const router  = express.Router();

const { login, logout, getProfile } = require('../controllers/authController');
const { verifyToken, redirectIfAuthenticated } = require('../middlewares/authMiddleware');

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES  (tidak butuh token)
// ─────────────────────────────────────────────────────────────


// POST /auth/login     → autentikasi & terbitkan JWT
router.post('/login',    redirectIfAuthenticated, login);

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES  (butuh token valid)
// ─────────────────────────────────────────────────────────────

// POST /auth/logout  → hapus cookie token
router.post('/logout', verifyToken, logout);

// GET  /auth/me      → kembalikan profil user yang sedang login
router.get('/me',     verifyToken, getProfile);

module.exports = router;
