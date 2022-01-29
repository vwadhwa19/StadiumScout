const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')


const StadiumSchema = new Schema({
    title: String,
    images: [
        { url: String, filename: String }
    ],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    capacity: String,
    description: String,
    location: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

StadiumSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Stadium', StadiumSchema);