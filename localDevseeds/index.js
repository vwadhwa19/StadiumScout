const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors, stadiums } = require('./seedHelpers');
const Stadium = require('../models/stadium');

mongoose.connect('mongodb://localhost:27017/stadium-scout', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Stadium.deleteMany({});
    for (let i = 0; i < 10; i++) {

        const capacityNumber = 10000 + Math.floor(Math.random() * 90000);
        const random1000 = Math.floor(Math.random() * 1000);
        const stadium = new Stadium({
            //YOUR USER ID
            author: '61f3732972e0f1b18092c3ba',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(stadiums)}`,
            description: "This is the description",
            capacity: capacityNumber,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dyafjiehs/image/upload/v1660445149/StadiumScoutDev/unitedDevTest_zpzuoa.jpg',
                    filename: 'StadiumScoutDev/unitedDevTest_zpzuoa',
                },
                {
                    url: 'https://res.cloudinary.com/dyafjiehs/image/upload/v1660445151/StadiumScoutDev/unitedDevTest1_trnvqg.jpg',
                    filename: 'StadiumScoutDev/unitedDevTest1_trnvqg',
                }
            ]
        })
        await stadium.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})