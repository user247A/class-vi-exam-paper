const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const Document = require("./models/document");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Upload document
app.post("/publish", upload.single("file"), async (req, res) => {
  try {
    const { header } = req.body;
    const file = req.file;

    const newDoc = new Document({
      header,
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      fileURL: `http://localhost:${process.env.PORT}/uploads/${file.filename}`,
    });

    await newDoc.save();
    res.json({ message: "✅ Document uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Failed to upload document." });
  }
});

// View all documents
app.get("/view", async (req, res) => {
  try {
    const docs = await Document.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch documents." });
  }
});

// Delete a document
app.delete("/delete/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // ⚠️ Safely attempt to delete the file
    try {
      if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      } else {
        console.warn("File does not exist:", doc.filePath);
      }
    } catch (fileErr) {
      console.warn("⚠️ Error deleting file:", fileErr.message);
    }

    await doc.deleteOne(); // delete from MongoDB
    res.json({ message: "🗑️ Document deleted successfully!" });
  } catch (err) {
    console.error("❌ Delete route error:", err);
    res.status(500).json({ message: "❌ Failed to delete document." });
  }
});
