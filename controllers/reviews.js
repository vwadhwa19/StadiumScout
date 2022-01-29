//Require
const Stadium = require('../models/stadium');
const Review = require('../models/review');
const catchAsync = require('../utils/catchAsync');

// Create a review
module.exports.createReview = catchAsync(async (req, res) => {
    const { stadiumId } = req.params;
    try {
        const stadium = await Stadium.findById(stadiumId);
        const review = new Review(req.body.review);
        review.author = req.user._id;
        stadium.reviews.push(review);
        await review.save();
        await stadium.save();
        req.flash('success', 'Succesfully created a new review!');
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    }
});

// Delete a review
module.exports.deleteReview = catchAsync(async (req, res) => {
    const { stadiumId, reviewId } = req.params;
    try {
        await Stadium.findByIdAndUpdate(stadiumId, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash('success', 'Succesfully deleted this review!');
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    }
});