const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const multer = require('multer'); // storing images on cloudinary
const { storage } = require('../cloudinary'); // storing images on cloudinary
const upload = multer({ storage }); // storing images on cloudinary

// Route coming into file '/' 

// Get request to show register form and post request to create user when register form submitted on the route '/register'. 
router.route('/register')
    .get(users.renderRegisterForm)
    .post(upload.array('avatarImage'), catchAsync(users.register));

// Get request to show login form and post request to login on the route '/login'. 
router.route('/login')
    .get(users.renderLoginForm)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);

// Get request to logout user on the route '/logout'. 
router.route('/logout')
    .get(users.logout);

module.exports = router;