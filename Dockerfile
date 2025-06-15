# Use Node.js 18 with Debian (better compatibility than Alpine)
FROM node:18

# Install system dependencies including Python and yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp from GitHub (most recent fixes)
RUN pip3 install --break-system-packages --upgrade git+https://github.com/yt-dlp/yt-dlp.git

# Verify yt-dlp installation
RUN yt-dlp --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1001 nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (Railway uses PORT env var)
EXPOSE $PORT

# Health check - use PORT environment variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/health || exit 1

# Start the application
CMD ["node", "server.js"]