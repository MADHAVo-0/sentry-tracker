const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const fileTrackModel = require('../db/models/fileTrack');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept all files for now, but you can add restrictions here
  cb(null, true);
};

// Initialize multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/files/upload
// @desc    Upload a file and track it
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Calculate risk level based on file type and size
    let riskLevel = 'low';
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const highRiskExts = ['.exe', '.bat', '.cmd', '.msi', '.dll', '.sh'];
    
    if (highRiskExts.includes(fileExt)) {
      riskLevel = 'high';
    } else if (req.file.size > 5 * 1024 * 1024) { // Files larger than 5MB
      riskLevel = 'medium';
    }

    // Add file to database
    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      userId: req.user.id,
      riskLevel
    };

    const fileTrack = await fileTrackModel.addFileTrack(fileData);
    
    res.json({
      file: fileTrack,
      msg: 'File uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/files
// @desc    Get all files for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const files = await fileTrackModel.getFileTracksByUser(req.user.id);
    res.json(files);
  } catch (err) {
    console.error('Error getting files:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/files/all
// @desc    Get all files (admin only)
// @access  Private/Admin
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const files = await fileTrackModel.getAllFileTracks();
    res.json(files);
  } catch (err) {
    console.error('Error getting all files:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/files/:id
// @desc    Update file status
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { status, riskLevel } = req.body;
    const fileId = req.params.id;
    
    const result = await fileTrackModel.updateFileTrackStatus(fileId, status, riskLevel);
    res.json(result);
  } catch (err) {
    console.error('Error updating file status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Get file info before deleting
    const files = await fileTrackModel.getFileTracksByUser(req.user.id);
    const fileToDelete = files.find(file => file.id === parseInt(fileId));
    
    if (!fileToDelete) {
      return res.status(404).json({ msg: 'File not found' });
    }
    
    // Check if user owns the file or is admin
    if (fileToDelete.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Delete file from filesystem
    fs.unlink(fileToDelete.path, async (err) => {
      if (err) {
        console.error('Error deleting file from filesystem:', err);
      }
      
      // Delete from database regardless of filesystem result
      const result = await fileTrackModel.deleteFileTrack(fileId);
      res.json(result);
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;