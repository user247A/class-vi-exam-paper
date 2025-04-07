const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const Document = require("./models/document");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "publisherDB"
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

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
      fileURL
    });

    await doc.save();
    res.json({ message: "✅ Document uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Upload failed" });
  }
});

app.get("/view", async (req, res) => {
  try {
    const docs = await Document.find().sort({ _id: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to fetch documents" });
  }
});

app.delete("/delete/:id", async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (doc && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    res.json({ message: "🗑️ Document deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
