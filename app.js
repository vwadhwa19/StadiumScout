if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const indexRoutes = require('./routes/index');
const stadiumRoutes = require('./routes/stadiums');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const createError = require('http-errors'); 
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
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

// Routes for the homepage
app.use('/', indexRoutes);

// Routes for the stadiums
app.use('/stadiums', stadiumRoutes);
 
// Routes for the reviews
app.use('/stadiums/:stadiumId/reviews', reviewRoutes); 

// Routes for the users
app.use('/users/:userId', userRoutes); 

// Error Handling
app.all('*', (req, res, next) => {
    next(createError(404, 'The resource you requested could not be found.'));
})

// Error handling
app.use((err, req, res, next) => {
    if (createError.isHttpError(err)) {
        res.status(err.statusCode);
        res.render('error', { err });
      } else {
        console.error(err.stack || err.message);
        res.status(500);
        res.render('error', { err: createError(500, 'An unexpected server error occured.') });
      }
});

// Check local evnvironment port connection
app.listen(port, () => {
    console.log(`serving on port ${port}`)
});