const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileURL: {
    type: String,
    required: true,
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("Document", documentSchema);
