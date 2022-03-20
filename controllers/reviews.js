//Require
const Stadium = require('../models/stadium');
const Review = require('../models/review');

// Create a review
module.exports.createReview = async (req, res) => {
    try {
        const { stadiumId } = req.params;
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
};

// Delete a review
module.exports.deleteReview = async (req, res) => {
    try {
        const { stadiumId, reviewId } = req.params;
        await Stadium.findByIdAndUpdate(stadiumId, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash('success', 'Succesfully deleted this review!');
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums/${stadiumId}/reviews`);
    }
};

module.exports.renderStadiumReviewsPage = async (req, res) => {
    const stadium = await Stadium.findById(req.params.stadiumId).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!stadium) {
        req.flash('error', 'Cannot find reviews for that stadium!');
        return res.redirect('/stadiums');
    }
    res.render("stadiums/reviews", { stadium, pageName: 'stadiums' });
};