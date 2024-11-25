const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => res.render('index'));

// Login route
router.get('/login', (req, res) => res.render('login'));

// Signup route
router.get('/signup', (req, res) => res.render('signup'));

module.exports = router;
