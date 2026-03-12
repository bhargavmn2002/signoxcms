const express = require('express');
const router = express.Router();
const { getDownloadUrl, trackDownload } = require('../controllers/playerApps.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/player-apps/download-url
 * @desc    Get download URL for player apps (APK or WGT)
 * @access  Private (Authenticated users)
 * @query   type - 'android' or 'tizen'
 */
router.get('/download-url', requireAuth, getDownloadUrl);

/**
 * @route   POST /api/player-apps/track-download
 * @desc    Track download analytics
 * @access  Private
 */
router.post('/track-download', requireAuth, trackDownload);

module.exports = router;
