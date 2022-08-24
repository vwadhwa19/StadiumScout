// Require
const User = require('../models/user');
const Stadium = require('../models/stadium');
const Review = require('../models/review');
const { cloudinary } = require("../cloudinary");
const admincode = process.env.ADMIN_CODE;

// Render register form 
module.exports.renderRegisterForm = (req, res) => {
    res.render('users/register', { pageName: 'register' });
}

// Create new user
module.exports.register = async (req, res, next) => {
    try {
        const { username, password, firstName, lastName, email, bio, adminCode } = req.body;
        const user = new User({ username, password, firstName, lastName, email, bio, adminCode });
        user.avatarImage = req.files.map(f => ({ url: f.path, filename: f.filename }));

        if (adminCode === admincode) {
            user.isAdmin = true;
        }
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Stadium Scout ' + username + '!');
            res.redirect('/stadiums');
        })
    } catch (e) {
        if (e.code === 11000) {
            req.flash('error', "A user with the given email is already registered!");
            res.redirect('/register');
        }
        else {
            req.flash('error', e.message);
            res.redirect('/register');
        }
    }
};

// Render user profile page
module.exports.renderUserProfilePage = async (req, res) => {

    const { userId } = req.params;
    const user = await User.findById(userId);
    const userStadiums = await Stadium.find().where("author").equals(user._id);
    if (!user) {
        req.flash('error', 'Cannot find that user profile!');
        return res.redirect('/stadiums');
    }

    res.render("users/show", { user: user, stadiums: userStadiums, pageName: 'userProfile' });
};

// Render edit single stadium form
module.exports.renderUserProfileEditForm = async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
        req.flash('error', 'Cannot find that user profile!');
        return res.redirect('/stadiums');
    }
    res.render('users/edit', { user, pageName: 'userProfile' });
};

// Update user profile
module.exports.updateUserProfile = async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
        req.flash('error', 'Cannot find that user profile!');
        return res.redirect('/stadiums');
    }
    try {
        // you will be logged out if username or password was updated
        let logout = false;
        if ((user.username !== req.body.username) || (user.password !== req.body.password))
            logout = true;

        await user.setPassword(req.body.password); // update passport.js if a user changes their password to remember authentication
        user.username = req.body.username;
        user.password = req.body.password;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.email = req.body.email;
        user.bio = req.body.bio;
        user.createdAt = Date.now();

        const newUserImage = req.files.map(f => ({ url: f.path, filename: f.filename }));
        if (newUserImage.length != 0) {
            await cloudinary.uploader.destroy(user.avatarImage[0].filename);
            user.avatarImage = newUserImage;
        }
        await user.save();

        // you will be logged out if username or password was updated
        if (logout) {
            req.logout();
            req.flash('success', 'Succesfully updated your profile and logged you out as your username and/or password was changed!');
        }
        else {
            req.flash('success', 'Succesfully updated your profile!');
        }

        res.redirect(`/users/${userId}`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/users/${userId}`);
    }
};

// Delete user profile
module.exports.deleteUserProfilePage = async (req, res) => {

    const { userId } = req.params;
    const user = await User.findById(userId);
    const userStadiums = await Stadium.find().where("author").equals(user._id);
    const userReviews = await Review.find().where("author").equals(user._id);

    try {
        for (let stadium of userStadiums) {
            for (let image of stadium.images) {
                await cloudinary.uploader.destroy(image.filename);
            }
            await Stadium.findByIdAndDelete(stadium._id);
        }

        for (let image of user.avatarImage) {
            await cloudinary.uploader.destroy(image.filename);
        }

        for (let review of userReviews) {
            await Review.findByIdAndDelete(review._id);
        }
        await User.findByIdAndDelete(user);

        req.flash("success", "Succesfully deleted your profile!");
        res.redirect('/stadiums');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums`);
    }

};

// Render login form 
module.exports.renderLoginForm = (req, res) => {
    res.render('users/login', { pageName: 'login' });
};

// Submit login page
module.exports.login = (req, res) => {
    const username = req.body.username;
    req.flash('success', 'Welcome back to Stadium Scout ' + username + '!');
    const redirectUrl = req.session.returnTo || '/stadiums';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

// Submit logout page
module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', "Succesfully logged out, come again soon!");
    res.redirect('/stadiums');
};