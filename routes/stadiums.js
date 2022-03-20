const express = require('express');
const router = express.Router({ mergeParams: true });
const stadiums = require('../controllers/stadiums');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isStadiumAuthor } = require('../middleware');
const multer = require('multer'); // storing images on cloudinary
const { storage } = require('../cloudinary'); // storing images on cloudinary
const upload = multer({ storage }); // storing images on cloudinary

// Route coming into file '/stadiums' 

// Get request to show stadiums on index page and post request to create new stadium on the route '/stadiums'
router.route('/')
    .get(catchAsync(stadiums.searchStadium))
    .post(isLoggedIn, upload.array('image'), catchAsync(stadiums.createStadium));

// Get request to show the create new stadium form on the route '/stadiums/new'
router.route('/new')
    .get(isLoggedIn, stadiums.renderNewForm); 

// Get request to show the maps for all stadiums form on the route '/stadiums/map'
router.route('/map')
    .get(catchAsync(stadiums.renderMapIndex)); 

// Get request to show a stadium, put request to update a stadium, and delete request to delete a stadium on the route '/stadiums/:stadiumId'
router.route('/:stadiumId')
    .get(catchAsync(stadiums.showStadium))
    .put(isLoggedIn, isStadiumAuthor, upload.array('image'), catchAsync(stadiums.updateStadium)) 
    .delete(isLoggedIn, isStadiumAuthor, catchAsync(stadiums.deleteStadium));

// Get request to show the edit stadium form on the route '/stadiums/edit'
router.route('/:stadiumId/edit')
    .get(isLoggedIn, isStadiumAuthor, catchAsync(stadiums.renderEditForm)); 

module.exports = router;