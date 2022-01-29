const Stadium = require('../models/stadium');
const catchAsync = require('../utils/catchAsync');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

// Render new stadium form
module.exports.renderNewForm = (req, res) => {
    res.render('stadiums/new', { pageName: 'newStadium' }
    );
};

// Create new stadium 
module.exports.createStadium = catchAsync(async (req, res, next) => {
    const stadium = new Stadium(req.body.stadium);
    try {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.stadium.location,
            limit: 1
        }).send()

        stadium.geometry = geoData.body.features[0].geometry;
        stadium.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        stadium.author = req.user._id;
        await stadium.save();
        req.flash('success', 'Succesfully created a new stadium!');
        res.redirect(`/stadiums/${stadium._id}`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums/${stadium._id}`);
    }
});

// Render a single stadium
module.exports.showStadium = catchAsync(async (req, res) => {
    const stadium = await Stadium.findById(req.params.stadiumId).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!stadium) {
        req.flash('error', 'Cannot find that stadium!');
        return res.redirect('/stadiums');
    }
    res.render('stadiums/show', { stadium, pageName: 'stadiums' })
});

// Render edit single stadium form
module.exports.renderEditForm = catchAsync(async (req, res) => {
    const { stadiumId } = req.params;
    const stadium = await Stadium.findById(stadiumId);
    if (!stadium) {
        req.flash('error', 'Cannot find that stadium!');
        return res.redirect('/stadiums');
    }
    res.render('stadiums/edit', { stadium, pageName: 'stadiums' });
});

// Update a single stadium 
module.exports.updateStadium = catchAsync(async (req, res) => {
    const { stadiumId } = req.params;
    try {
        const stadium = await Stadium.findByIdAndUpdate(stadiumId, { ...req.body.stadium });
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
        stadium.images.push(...imgs);
        stadium.createdAt = Date.now();
        if (req.body.deleteImages) {
            for (let filename of req.body.deleteImages) {
                await cloudinary.uploader.destroy(filename);
            }
            await stadium.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
        }
        await stadium.save();
        req.flash('success', 'Succesfully updated this stadium!');
        res.redirect(`/stadiums/${stadiumId}`);
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`/stadiums/${stadiumId}`);
    }
});

// Delete a stadium
module.exports.deleteStadium = catchAsync(async (req, res) => {
    const { stadiumId } = req.params;
    const stadium = await Stadium.findById(stadiumId);
    try {
        await Stadium.findByIdAndDelete(stadiumId);
        for (let image of stadium.images) {
            await cloudinary.uploader.destroy(image.filename);
        }
        req.flash('success', 'Succesfully deleted this stadium!');
        res.redirect('/stadiums');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/stadiums');
    }

});

// For Fuzzy Search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Render stadium index page with searching
module.exports.searchStadium = catchAsync(async (req, res) => {
    let perPage = 8;
    let pageQuery = parseInt(req.query.page);
    let pageNumber = pageQuery ? pageQuery : 1;
    let noMatch = null;
    let search = req.query.search;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Stadium.find({ title: regex }).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allStadiums) {
            Stadium.countDocuments({ title: regex }).exec(function (err, count) {
                if (err) {
                    res.redirect("back");
                } else {
                    if (allStadiums.length < 1) {
                        noMatch = `No stadiums match the search '${search}', please try again!`;
                    }
                    res.render("stadiums/index", {
                        stadiums: allStadiums,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search,
                        count: count,
                        pageName: 'stadiums'
                    });
                }
            });
        });
    } else {
        Stadium.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allStadiums) {
            Stadium.countDocuments().exec(function (err, count) {
                if (err) {
                    req.flash("error", "Sorry, something unexpected went wrong!");
                } else {
                    res.render("stadiums/index", {
                        stadiums: allStadiums,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false,
                        count: count,
                        pageName: 'stadiums'
                    });
                }
            });
        });
    }
});

// Render stadium map page
module.exports.renderMapIndex = catchAsync(async (req, res) => {
    let noMatch = null;
    let search = req.query.search;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Stadium.find({ title: regex }, function (err, allStadiums) {
            if (err) {
                req.flash("error", "Sorry, something unexpected went wrong!");
            } else {
                if (allStadiums.length < 1) {
                    noMatch = `No stadiums match the search '${search}', please try again!`;
                }
                res.render("stadiums/mapindex", {
                    stadiums: allStadiums,
                    noMatch: noMatch,
                    pageName: 'stadiumsMap',
                    count: allStadiums.length,
                    search: req.query.search
                });
            }
        });
    } else {
        Stadium.find({}, function (err, allStadiums) {
            if (err) {
                req.flash("error", "Sorry, something unexpected went wrong.");
            } else {
                res.render("stadiums/mapindex", {
                    stadiums: allStadiums,
                    noMatch: noMatch,
                    pageName: 'stadiumsMap',
                    search: false,
                    count: allStadiums.length
                });
            }
        });
    }
});

module.exports.renderStadiumReviewsPage = catchAsync(async (req, res) => {
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
});