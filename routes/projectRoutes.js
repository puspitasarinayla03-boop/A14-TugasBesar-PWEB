'use strict';

const express = require('express');
const router  = express.Router();

const { isAuthenticated }                    = require('../middlewares/authMiddleware');
const { index, store, show, update, destroy } = require('../controllers/projectController');

router.get('/',       isAuthenticated, index);
router.post('/',      isAuthenticated, store);
router.get('/:id',    isAuthenticated, show);
router.put('/:id',    isAuthenticated, update);
router.delete('/:id', isAuthenticated, destroy);

module.exports = router;
