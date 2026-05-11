const express = require('express');
const multer = require('multer');
const intakeController = require('../controllers/intakeController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!'), false);
    }
  },
});

router.post('/', upload.single('video'), intakeController.handleWebUpload);

module.exports = router;
