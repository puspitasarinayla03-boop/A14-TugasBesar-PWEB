'use strict';

const express = require('express');
const router  = express.Router();

const { login, logout }                        = require('../controllers/authController');
const { redirectIfAuthenticated, isAuthenticated } = require('../middlewares/authMiddleware');

// POST /auth/login
router.post('/login', redirectIfAuthenticated, login);

// POST /auth/logout
router.post('/logout', isAuthenticated, logout);

module.exports = router;
