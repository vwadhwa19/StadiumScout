if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const { isLoggedIn, isStadiumAuthor, isReviewAuthor, isUserProfileOwner, checkUserReviewMade } = require('./middleware');
const stadiums = require('./controllers/stadiums');
const reviews = require('./controllers/reviews');
const users = require('./controllers/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const multer = require('multer');
const { storage } = require('./cloudinary');
const upload = multer({ storage });
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/stadium-scout';  // production || development
const secret = process.env.SECRET || 'thisshouldbeabettersecret';                // production || development
const port = process.env.PORT || 3000; // production || development

// Production DB (MongoDB Atlas): mongodb+srv://varun:varun@stadiumscoutcluster.93qbe.mongodb.net/StadiumScoutDatabase?retryWrites=true&w=majority
// Local DB (MongoDB): mongodb://localhost:27017/stadium-scout 

// MongoDB Connection
mongoose.connect(dbUrl, {
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

// Setting up app 
const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));

// Mongo DB Session
const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    secret: secret,
    touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
    console.log("Session store error", e);
})

// Configuring Session
const sessionConfig = {
    store,
    name: 'session',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, 
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));

// Mongo Sanitize 
app.use(mongoSanitize());

// Flash messages
app.use(flash());

// Show time lapsed from a specific time 
app.locals.moment = require("moment");

// Passport Authentication 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Render Home Page
app.get('/', (req, res) => {
    res.render('home');
});

// Render all stadiums page
app.get('/stadiums', stadiums.searchStadium);

// Render new stadium form
app.get('/stadiums/new', isLoggedIn, stadiums.renderNewForm);

// Render stadium map index page
app.get('/stadiums/map', stadiums.renderMapIndex);

// Create new stadium 
app.post('/stadiums', isLoggedIn, upload.array('image'), stadiums.createStadium);

// Render a single stadium
app.get('/stadiums/:stadiumId', stadiums.showStadium);

// Render edit single stadium form
app.get('/stadiums/:stadiumId/edit', isLoggedIn, isStadiumAuthor, stadiums.renderEditForm);

// Update a single stadium 
app.put('/stadiums/:stadiumId', isLoggedIn, isStadiumAuthor, upload.array('image'), stadiums.updateStadium);

// Delete a stadium
app.delete('/stadiums/:stadiumId', isLoggedIn, isStadiumAuthor, stadiums.deleteStadium);

// Create new review
app.post('/stadiums/:stadiumId/reviews', isLoggedIn, checkUserReviewMade, reviews.createReview);

// Delete a review
app.delete('/stadiums/:stadiumId/reviews/:reviewId', isLoggedIn, isReviewAuthor, reviews.deleteReview);

// Render reviews for stadium  
app.get('/stadiums/:stadiumId/reviews', stadiums.renderStadiumReviewsPage);

// Render register form 
app.get('/register', users.renderRegisterForm);

// Create new user
app.post('/register', users.register, upload.array('avatarImage'));

// Render user profile page 
app.get('/users/:userId', users.renderUserProfilePage);

// Render user profile edit form
app.get('/users/:userId/edit', isLoggedIn, isUserProfileOwner, users.renderUserProfileEditForm);

// Update a user profile 
app.put('/users/:userId', isLoggedIn, isUserProfileOwner, users.updateUserProfile, upload.array('avatarImage'));

// Delete user profile page 
app.delete('/users/:userId', isLoggedIn, isUserProfileOwner, users.deleteUserProfilePage);

// Render login form
app.get('/login', users.renderLoginForm);

// Submit Login page
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);

// Render logout page
app.get('/logout', users.logout);

// Error Handling
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

// Error handling
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err;
    res.status(statusCode).render('error', { err });
});

// Check local connection
app.listen(port, () => {
    console.log(`serving on port ${port}`)
});