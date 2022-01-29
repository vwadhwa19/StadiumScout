const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

let storage = 1;

const storageDev = new CloudinaryStorage({

    cloudinary,
    params: {
        folder: 'StadiumScoutDev',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

const storageProd = new CloudinaryStorage({

    cloudinary,
    params: {
        folder: 'StadiumScoutProd',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

if (process.env.NODE_ENV === "production")
    storage = storageProd;
else
    storage = storageDev;

module.exports = {
    cloudinary,
    storage,
}; 