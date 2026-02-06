const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const router = express.Router();
const puzzlesDir = path.join(__dirname, '..', '..', 'puzzles');

// Sanitize filename: lowercase, replace non-alphanumeric with hyphens, collapse runs
function sanitizeFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Find a unique filename by appending -2, -3, etc. if needed
function deduplicateFilename(base, ext) {
    let candidate = base + ext;
    let counter = 2;
    while (fs.existsSync(path.join(puzzlesDir, candidate))) {
        candidate = `${base}-${counter}${ext}`;
        counter++;
    }
    return candidate;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, puzzlesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const rawName = path.basename(file.originalname, path.extname(file.originalname));
        const sanitized = sanitizeFilename(rawName) || 'upload';
        const finalName = deduplicateFilename(sanitized, ext);
        cb(null, finalName);
    }
});

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.supportedImageFormats.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported format. Allowed: ${config.supportedImageFormats.join(', ')}`));
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: config.maxUploadSize }
});

router.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    const puzzleId = path.basename(req.file.filename, path.extname(req.file.filename));
    res.json({
        success: true,
        puzzleId,
        playUrl: `/play/${puzzleId}`
    });
});

// Error handler for multer
router.use('/api/upload', (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: `File too large. Maximum size is ${Math.round(config.maxUploadSize / 1024 / 1024)}MB.`
            });
        }
        return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
    next();
});

module.exports = router;
