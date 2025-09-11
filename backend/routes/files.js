// routes/files.js
const express = require('express');
const router = express.Router();
const fileCtrl = require('../controllers/fileController');
const auth = require('../middleware/auth');

router.post('/upload', auth, fileCtrl.uploadFile);
router.get('/', auth, fileCtrl.listFiles);
router.get('/:id', auth, fileCtrl.getFile);
router.delete('/:id', auth, fileCtrl.deleteFile);

module.exports = router;
