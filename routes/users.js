const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn, isUserProfileOwner } = require('../middleware');
const users = require('../controllers/users');
const multer = require('multer');
const { storage } = require('../cloudinary'); // storing images on cloudinary
const upload = multer({ storage }); // storing images on cloudinary
const catchAsync = require('../utils/catchAsync'); // storing images on cloudinary

// Route coming into file '/users/:userId' 

// Get request to show user profile page, put request to update user profile, and delete request to delete user profile on the route '/users/:userId'. 
router.route('/')
.get(catchAsync(users.renderUserProfilePage))
.put(isLoggedIn, isUserProfileOwner, upload.array('avatarImage'), catchAsync(users.updateUserProfile))
.delete(isLoggedIn, isUserProfileOwner, catchAsync(users.deleteUserProfilePage));

// Get request to show edit user profile page on the route '/users/:userId/edit'. 
router.route('/edit')
.get(isLoggedIn, isUserProfileOwner, catchAsync(users.renderUserProfileEditForm)); 

///*upload.array('avatarImage'), */
module.exports = router;