// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  storagePath: { type: String, required: true }, // path to ciphertext file
  iv: { type: String, required: true },          // base64 iv
  wrappedKey: { type: String, required: true },  // base64 wrapped AES key
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// ✅ Prevent OverwriteModelError
const File = mongoose.models.File || mongoose.model("File", fileSchema);

module.exports = File;
