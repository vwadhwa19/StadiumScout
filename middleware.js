const Stadium = require('./models/stadium');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be logged in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.isStadiumAuthor = async (req, res, next) => {
    const { stadiumId } = req.params;
    const stadium = await Stadium.findById(stadiumId);
    if (!stadium.author.equals(req.user._id) && (!req.user.isAdmin)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/stadiums/${stadiumId}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { stadiumId, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id) && (!req.user.isAdmin)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/stadiums/${stadiumId}`);
    }
    next();
};

module.exports.isUserProfileOwner = async (req, res, next) => {
    const { userId } = req.params;
    if (!req.user._id.equals(userId) && (!req.user.isAdmin)) {
        req.flash('error', 'You do not have permission to do that!')
        return res.redirect(`/users/${userId}`);
    }
    next();
};

module.exports.checkUserReviewMade = async (req, res, next) => {
    const { stadiumId } = req.params;
    const stadium = await Stadium.findById(stadiumId);
    const review = new Review(req.body.review);
    review.author = req.user._id;

    for (let eachReview of stadium.reviews) {
        const rev = await Review.findById(eachReview._id);
        if (rev != null) {
            if (rev.author._id.equals(req.user._id)) {
                req.flash('error', 'You have already created a review for this stadium!');
                return res.redirect(`/stadiums/${stadiumId}/reviews`);
            }
        }
    }
    next();
};