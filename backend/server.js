const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Document = require("./models/document");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "documents",
    resource_type: "auto", // handles image/pdf
    allowed_formats: ["jpg", "jpeg", "png", "pdf"]
  }
});
const upload = multer({ storage });

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// Upload route
app.post("/publish", upload.single("file"), async (req, res) => {
  try {
    const { header } = req.body;
    const file = req.file;

    const newDoc = new Document({
      header,
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      fileURL: file.path // cloudinary secure_url
    });

    await newDoc.save();
    res.json({ message: "✅ Document uploaded successfully!" });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Failed to upload document." });
  }
});

// View all
app.get("/view", async (req, res) => {
  try {
    const docs = await Document.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
