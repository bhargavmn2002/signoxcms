/**
 * Player Apps Controller
 * Handles download URLs for Android APK and Tizen WGT player applications
 */

/**
 * Get download URL for player apps
 * 
 * This endpoint can be configured to:
 * 1. Return public folder URLs (default)
 * 2. Generate S3 signed URLs (when S3 is configured)
 * 3. Track download analytics
 */
exports.getDownloadUrl = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !['android', 'tizen'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be "android" or "tizen"'
      });
    }

    // Option 1: Use S3 if configured (recommended for production)
    if (process.env.USE_S3_FOR_PLAYER_APPS === 'true') {
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const fileName = type === 'android' ? 'signox-player.apk' : 'signox-player.wgt';
      const s3Key = `player-apps/${fileName}`;

      // Generate signed URL (valid for 1 hour)
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Expires: 3600, // 1 hour
        ResponseContentDisposition: `attachment; filename="${fileName}"`
      });

      return res.json({
        downloadUrl: signedUrl,
        fileName,
        expiresIn: 3600
      });
    }

    // Option 2: Use public folder (default)
    const fileName = type === 'android' ? 'signox-player.apk' : 'signox-player.wgt';
    const publicUrl = `/downloads/${fileName}`;

    return res.json({
      downloadUrl: publicUrl,
      fileName
    });

  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({
      error: 'Failed to generate download URL'
    });
  }
};

/**
 * Track download analytics (optional)
 */
exports.trackDownload = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user?.id;

    // Log download for analytics
    console.log(`Player app download: ${type} by user ${userId || 'anonymous'}`);

    // You can store this in database for analytics
    // await prisma.downloadLog.create({
    //   data: {
    //     appType: type,
    //     userId: userId,
    //     downloadedAt: new Date()
    //   }
    // });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    return res.status(500).json({ error: 'Failed to track download' });
  }
};
