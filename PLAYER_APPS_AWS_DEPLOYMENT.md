# Player Apps Download - AWS Deployment Guide

## Overview
The Player Apps download feature supports two deployment methods:
1. **Public Folder Method** (Simple, works out-of-the-box)
2. **S3 + CloudFront Method** (Recommended for production)

## Current Implementation

### Frontend
The frontend tries to fetch download URLs from the backend API first, then falls back to public folder URLs if the API is not available.

**Files:**
- `frontend/src/app/user/player-apps/page.tsx`
- `signox_frontend/src/app/user/player-apps/page.tsx`

### Backend
Optional API endpoint that can serve URLs from either public folder or S3.

**Files:**
- `backend/src/controllers/playerApps.controller.js`
- `backend/src/routes/playerApps.routes.js`
- `signox_backend/src/controllers/playerApps.controller.js`
- `signox_backend/src/routes/playerApps.routes.js`

## Deployment Options

### Option 1: Public Folder (Default)

**How it works:**
- APK and WGT files are stored in `frontend/public/downloads/`
- Next.js serves these files as static assets
- Works on any hosting platform (Vercel, AWS EC2, AWS Amplify, etc.)

**Pros:**
- Simple setup, no configuration needed
- Works immediately after deployment
- No additional AWS services required

**Cons:**
- Large files increase deployment size
- No download analytics
- Files are publicly accessible (anyone with URL can download)

**AWS Deployment:**
```bash
# Files are already in place
frontend/public/downloads/signox-player.apk
frontend/public/downloads/signox-player.wgt

# Deploy normally - files will be included in build
npm run build
# Deploy to AWS (EC2, Amplify, or S3+CloudFront)
```

### Option 2: S3 + CloudFront (Recommended for Production)

**How it works:**
- APK and WGT files are stored in S3 bucket
- Backend generates signed URLs (secure, time-limited)
- CloudFront CDN distributes files globally
- Download analytics can be tracked

**Pros:**
- Smaller deployment size
- Secure downloads with signed URLs
- Global CDN distribution (faster downloads)
- Download tracking and analytics
- Easy to update files without redeploying

**Cons:**
- Requires AWS S3 setup
- Additional AWS costs (minimal for small files)
- Slightly more complex configuration

**Setup Steps:**

#### 1. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://your-signox-player-apps --region us-east-1

# Create folder structure
aws s3 cp signox-android-player/app/build/outputs/apk/debug/app-debug.apk \
  s3://your-signox-player-apps/player-apps/signox-player.apk

aws s3 cp tizen-player/signox-player.wgt \
  s3://your-signox-player-apps/player-apps/signox-player.wgt
```

#### 2. Configure S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBackendAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_BACKEND_ROLE"
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::your-signox-player-apps/player-apps/*"
    }
  ]
}
```

#### 3. Set Environment Variables
Add to your backend `.env` file:

```env
# Enable S3 for player apps
USE_S3_FOR_PLAYER_APPS=true

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-signox-player-apps
```

#### 4. Optional: Setup CloudFront
```bash
# Create CloudFront distribution for S3 bucket
# This provides global CDN and HTTPS
aws cloudfront create-distribution \
  --origin-domain-name your-signox-player-apps.s3.amazonaws.com \
  --default-root-object index.html
```

## File Locations

### Current Files
```
frontend/public/downloads/
├── signox-player.apk (11MB)
└── signox-player.wgt (738KB)

signox_frontend/public/downloads/
├── signox-player.apk (11MB)
└── signox-player.wgt (738KB)
```

### Source Files
```
signox-android-player/app/build/outputs/apk/debug/app-debug.apk
tizen-player/signox-player.wgt
```

## API Endpoints

### GET /api/player-apps/download-url
Get download URL for player apps.

**Query Parameters:**
- `type` (required): `android` or `tizen`

**Response:**
```json
{
  "downloadUrl": "https://...",
  "fileName": "signox-player.apk",
  "expiresIn": 3600  // Only for S3 signed URLs
}
```

**Example:**
```javascript
const response = await fetch('/api/player-apps/download-url?type=android');
const data = await response.json();
// data.downloadUrl contains the download link
```

### POST /api/player-apps/track-download
Track download analytics (optional).

**Body:**
```json
{
  "type": "android"
}
```

## Testing

### Test Public Folder Method
1. Start the application locally
2. Login as USER_ADMIN
3. Navigate to "Player Apps" menu
4. Click download buttons
5. Files should download from `/downloads/` path

### Test S3 Method
1. Set `USE_S3_FOR_PLAYER_APPS=true` in backend `.env`
2. Configure AWS credentials
3. Upload files to S3
4. Test download - should receive signed S3 URLs

## Updating Player Apps

### Public Folder Method
```bash
# Replace files in public folder
cp new-signox-player.apk frontend/public/downloads/signox-player.apk
cp new-signox-player.wgt frontend/public/downloads/signox-player.wgt

# Redeploy application
npm run build
# Deploy to AWS
```

### S3 Method
```bash
# Upload new files to S3 (no redeployment needed!)
aws s3 cp new-signox-player.apk \
  s3://your-signox-player-apps/player-apps/signox-player.apk

aws s3 cp new-signox-player.wgt \
  s3://your-signox-player-apps/player-apps/signox-player.wgt

# Files are immediately available
```

## Security Considerations

### Public Folder
- Files are publicly accessible
- Anyone with URL can download
- No expiration or access control

### S3 with Signed URLs
- URLs expire after 1 hour (configurable)
- Requires authentication to get URL
- Can track who downloads what
- Can revoke access by changing S3 permissions

## Cost Estimation (AWS)

### S3 Storage
- ~12MB total storage
- Cost: ~$0.023/month (negligible)

### S3 Data Transfer
- Assuming 100 downloads/month
- ~1.2GB transfer
- Cost: ~$0.11/month

### CloudFront (Optional)
- First 1TB free per month
- Additional cost: $0.085/GB after free tier

**Total estimated cost: < $1/month**

## Troubleshooting

### Downloads not working
1. Check browser console for errors
2. Verify files exist in public folder or S3
3. Check backend logs for API errors
4. Verify AWS credentials if using S3

### S3 Access Denied
1. Check IAM role permissions
2. Verify bucket policy
3. Check AWS credentials in .env
4. Ensure bucket name is correct

### Files not found
1. Verify file paths match exactly
2. Check file names (case-sensitive)
3. Ensure files were uploaded correctly

## Recommendations

**For Development:**
- Use public folder method (simpler)

**For Production:**
- Use S3 + CloudFront method
- Enable download tracking
- Set up CloudWatch monitoring
- Use signed URLs for security

**For Small Deployments:**
- Public folder is sufficient
- Easy to maintain

**For Large Scale:**
- S3 + CloudFront is essential
- Better performance globally
- Lower bandwidth costs
- Easier updates
