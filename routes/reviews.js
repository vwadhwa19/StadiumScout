const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn, checkUserReviewMade, isReviewAuthor } = require('../middleware');
const reviews = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');

// Route coming into file '/stadiums/:stadiumId/reviews' 

// Get request to show reviews and post request to create a review on the route '/stadiums/:stadiumId/reviews'. 
router.route('/')
.get(catchAsync(reviews.renderStadiumReviewsPage))
.post(isLoggedIn, checkUserReviewMade, catchAsync(reviews.createReview)); 

// Delete request to delete a review on the route '/stadiums/:stadiumId/reviews/:reviewId'. 
router.route('/:reviewId')
.delete(isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;