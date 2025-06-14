# Railway YT-DLP Server

Express.js server with yt-dlp for social media downloading, optimized for Railway deployment.

## Features

- 🚀 **yt-dlp integration** - Robust social media content extraction
- 🔒 **Security** - Rate limiting, CORS, helmet
- 📱 **Multi-platform** - Instagram, TikTok, Facebook, YouTube
- ⚡ **Fast** - Optimized for Railway cloud deployment
- 🛡️ **Production ready** - Error handling, logging, health checks

## API Endpoints

### `GET /health`
Health check endpoint
```json
{
  "success": true,
  "status": "healthy",
  "ytdlp": "available"
}
```

### `POST /metadata`
Extract metadata without downloading
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### `POST /download`
Get download URL with quality/format options
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "best",
  "format": "mp4"
}
```

### `GET /status`
Platform status information

## Railway Deployment

1. **Connect Repository** to Railway
2. **Set Environment Variables** (optional):
   - `ALLOWED_ORIGINS` - Comma-separated allowed origins
   - `NODE_ENV=production`
3. **Deploy** - Railway will automatically build and deploy

## Docker Support

```bash
# Build
docker build -t railway-ytdlp .

# Run
docker run -p 3000:3000 railway-ytdlp
```

## Local Development

```bash
npm install
npm run dev
```

## Security Features

- Rate limiting (10 requests/minute per IP)
- CORS protection
- Helmet security headers
- Input sanitization
- Command injection prevention

## Supported Platforms

- ✅ YouTube (mp4, mp3, webm)
- ✅ Instagram (mp4, mp3)
- ✅ TikTok (mp4, mp3)
- ✅ Facebook (mp4, mp3)