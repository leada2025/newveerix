// utils/cloudinary.js
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "quotes",
    resource_type: "raw",    // ✅ must be raw for PDFs
    format: "pdf",
    use_filename: true,
    unique_filename: false,
    allowed_formats: ["pdf"],
  }),
});

const upload = multer({ storage });
module.exports = { cloudinary, upload };
