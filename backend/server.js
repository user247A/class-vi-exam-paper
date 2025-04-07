const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Document = require("./models/document");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Upload document
app.post("/publish", upload.single("file"), async (req, res) => {
  try {
    const { header } = req.body;
    const file = req.file;

    const fileURL = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    const doc = new Document({
      header,
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      fileURL,
    });

    await doc.save();
    res.json({ message: "✅ Document uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to upload document" });
  }
});

// View documents
app.get("/view", async (req, res) => {
  try {
    const docs = await Document.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to fetch documents" });
  }
});

// Delete document
app.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Document.findByIdAndDelete(id);
    res.json({ message: "🗑️ Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "❌ Failed to delete document" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
