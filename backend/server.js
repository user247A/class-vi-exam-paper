const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb+srv://ssvt:ssvt123@cluster0.hzuqcwl.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema
const fileSchema = new mongoose.Schema({
  fileName: String,
  filePath: String,
  fileType: String,
  header: String,
});
const File = mongoose.model("File", fileSchema);

// Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { header } = req.body;
    const file = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      header: header || "Untitled",
    });

    await file.save();
    res.status(200).json({ message: "File uploaded successfully", file });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// View endpoint
app.get("/view", async (req, res) => {
  try {
    const files = await File.find().sort({ _id: -1 });
    const baseUrl = req.protocol + "://" + req.get("host");

    const response = files.map((file) => ({
      _id: file._id,
      fileName: file.fileName,
      fileURL: baseUrl + "/" + file.filePath.replace(/\\/g, "/"),
      fileType: file.fileType,
      header: file.header,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("View Error:", error);
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});

// Download endpoint
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Static file serving with CORS headers for iframe support
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
