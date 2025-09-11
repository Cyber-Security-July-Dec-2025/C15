// controllers/fileController.js
const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

async function ensureUploadDir() {
  try { await fs.mkdir(UPLOAD_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

exports.uploadFile = async (req, res) => {
  try {
    const { envelope, filename, metadata } = req.body;
    if (!envelope || !envelope.ciphertext || !envelope.iv || !envelope.wrappedKey) {
      return res.status(400).json({ message: 'Invalid envelope' });
    }

    await ensureUploadDir();
    const id = new mongoose.Types.ObjectId();
    const storagePath = path.join(UPLOAD_DIR, `${id.toString()}.bin`);
    const ciphertextBuffer = Buffer.from(envelope.ciphertext, 'base64');

    // write ciphertext to disk (server never sees keys)
    await fs.writeFile(storagePath, ciphertextBuffer);

    const fileDoc = await File.create({
      _id: id,
      owner: req.userId,
      filename: filename || 'unknown',
      storagePath,
      iv: envelope.iv,
      wrappedKey: envelope.wrappedKey,
      metadata: metadata || {}
    });

    return res.status(201).json({ id: fileDoc._id, filename: fileDoc.filename });
  } catch (err) {
    console.error('uploadFile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.userId }).select('_id filename createdAt');
    return res.json(files.map(f => ({ id: f._id, filename: f.filename, createdAt: f.createdAt })));
  } catch (err) {
    console.error('listFiles error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getFile = async (req, res) => {
  try {
    const id = req.params.id;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ message: 'Not found' });
    if (fileDoc.owner.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    const ciphertext = await fs.readFile(fileDoc.storagePath);
    return res.json({
      envelope: {
        ciphertext: ciphertext.toString('base64'),
        iv: fileDoc.iv,
        wrappedKey: fileDoc.wrappedKey
      },
      filename: fileDoc.filename
    });
  } catch (err) {
    console.error('getFile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const id = req.params.id;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ message: 'Not found' });
    if (fileDoc.owner.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    await fs.unlink(fileDoc.storagePath).catch(() => {});
    await fileDoc.deleteOne();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteFile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
