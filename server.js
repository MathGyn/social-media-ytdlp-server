const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { exec } = require('child_process');
const { promisify } = require('util');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyType: 'ip',
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Utility functions
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
    return 'instagram';
  } else if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com')) {
    return 'tiktok';
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') || urlLower.includes('fb.watch')) {
    return 'facebook';
  } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  
  return null;
}

function validateUrl(url) {
  try {
    new URL(url);
    const platform = detectPlatform(url);
    if (!platform) {
      return { 
        isValid: false, 
        message: 'Plataforma não suportada. Use YouTube, Instagram, TikTok ou Facebook.' 
      };
    }
    return { isValid: true, platform };
  } catch (error) {
    return { 
      isValid: false, 
      message: 'URL inválida. Verifique o formato da URL.' 
    };
  }
}

function sanitizeCommand(input) {
  // Remove dangerous characters and escape quotes
  return input.replace(/[;&|`$(){}[\]]/g, '').replace(/'/g, "\\'");
}

async function executeYtDlp(args, options = {}) {
  const sanitizedArgs = args.map(arg => sanitizeCommand(arg));
  
  // For YouTube, use multi-fallback strategy
  if (options.isYoutube) {
    return await executeYouTubeMultiFallback(sanitizedArgs);
  }
  
  // For other platforms, use standard approach
  const command = `yt-dlp ${sanitizedArgs.join(' ')}`;
  console.log(`Executing: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    console.error('yt-dlp error:', error.message);
    return { success: false, error: error.message };
  }
}

async function executeYouTubeMultiFallback(sanitizedArgs) {
  const strategies = [
    {
      name: 'iOS Client',
      args: [
        '--user-agent', '"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"',
        '--extractor-args', '"youtube:player_client=ios"',
        '--no-check-certificates'
      ]
    },
    {
      name: 'Android TV Client',
      args: [
        '--user-agent', '"Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36"',
        '--extractor-args', '"youtube:player_client=tv_embedded"',
        '--no-check-certificates'
      ]
    },
    {
      name: 'Mobile Web Client',
      args: [
        '--user-agent', '"Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36"',
        '--extractor-args', '"youtube:player_client=mweb"',
        '--no-check-certificates',
        '--sleep-interval', '3'
      ]
    },
    {
      name: 'Basic Web Client',
      args: [
        '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
        '--extractor-args', '"youtube:player_client=web"',
        '--no-check-certificates',
        '--sleep-interval', '5'
      ]
    }
  ];
  
  for (const strategy of strategies) {
    console.log(`Trying YouTube strategy: ${strategy.name}`);
    
    const command = `yt-dlp ${strategy.args.join(' ')} ${sanitizedArgs.join(' ')}`;
    console.log(`Executing: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 90000, // Shorter timeout for each attempt
        maxBuffer: 10 * 1024 * 1024
      });
      
      if (stdout && !stderr.includes('ERROR')) {
        console.log(`✅ Success with strategy: ${strategy.name}`);
        return { success: true, output: stdout, error: stderr };
      }
      
      if (stderr && stderr.includes('Sign in to confirm')) {
        console.log(`❌ Bot detection with ${strategy.name}, trying next strategy...`);
        continue;
      }
      
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      
      return { success: true, output: stdout, error: stderr };
      
    } catch (error) {
      console.log(`❌ Strategy ${strategy.name} failed: ${error.message}`);
      
      // If this is the last strategy, return the error
      if (strategy === strategies[strategies.length - 1]) {
        return { success: false, error: `All YouTube strategies failed. Last error: ${error.message}` };
      }
      
      // Otherwise, continue to next strategy
      continue;
    }
  }
  
  return { success: false, error: 'All YouTube extraction strategies failed' };
}

// Routes

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test yt-dlp availability
    const result = await executeYtDlp(['--version']);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ytdlp: result.success ? 'available' : 'unavailable',
      version: result.success ? result.output.trim() : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get metadata
app.post('/metadata', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL é obrigatória'
      });
    }
    
    const validation = validateUrl(url);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: validation.message
      });
    }
    
    console.log(`Extracting metadata for: ${url}`);
    
    const result = await executeYtDlp([
      '--dump-json',
      '--no-download',
      '--ignore-errors',
      '--no-warnings',
      '--skip-download',
      `"${url}"`
    ], { isYoutube: validation.platform === 'youtube' });
    
    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: `Erro ao extrair metadados: ${result.error}`
      });
    }
    
    try {
      const metadata = JSON.parse(result.output);
      
      res.json({
        success: true,
        metadata: {
          title: metadata.title || 'Conteúdo de Mídia Social',
          description: metadata.description || '',
          author: metadata.uploader || metadata.channel || 'Desconhecido',
          thumbnail: metadata.thumbnail || '',
          duration: metadata.duration || 0,
          platform: validation.platform,
          view_count: metadata.view_count || 0,
          like_count: metadata.like_count || 0,
          upload_date: metadata.upload_date || '',
          is_live: metadata.is_live || false,
          availability: metadata.availability || 'public'
        }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(422).json({
        success: false,
        error: 'Erro ao processar metadados do conteúdo'
      });
    }
    
  } catch (error) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Download content
app.post('/download', async (req, res) => {
  try {
    const { url, quality = 'best', format = 'mp4' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL é obrigatória'
      });
    }
    
    const validation = validateUrl(url);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: validation.message
      });
    }
    
    console.log(`Processing download: ${url} (${quality}, ${format})`);
    
    // Build format selector
    let formatSelector = 'best';
    
    if (format === 'mp3') {
      formatSelector = 'bestaudio/best';
    } else if (format === 'mp4') {
      if (quality === 'best') {
        formatSelector = 'best[ext=mp4]/best';
      } else if (quality === 'worst') {
        formatSelector = 'worst[ext=mp4]/worst';
      } else if (quality === 'bestvideo') {
        formatSelector = 'bestvideo[ext=mp4]/bestvideo';
      } else if (quality === 'bestaudio') {
        formatSelector = 'bestaudio/best';
      }
    } else if (format === 'webm') {
      formatSelector = 'best[ext=webm]/best';
    }
    
    // Get download URL
    const result = await executeYtDlp([
      '--get-url',
      '--format', `"${formatSelector}"`,
      '--no-warnings',
      `"${url}"`
    ], { isYoutube: validation.platform === 'youtube' });
    
    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: `Erro ao gerar URL de download: ${result.error}`
      });
    }
    
    const downloadUrl = result.output.trim();
    
    if (!downloadUrl) {
      return res.status(422).json({
        success: false,
        error: 'Não foi possível obter URL de download'
      });
    }
    
    // Get media info
    const infoResult = await executeYtDlp([
      '--dump-json',
      '--no-download',
      `"${url}"`
    ], { isYoutube: validation.platform === 'youtube' });
    
    let mediaInfo = {
      title: `Conteúdo de ${validation.platform}`,
      description: '',
      author: 'Desconhecido',
      thumbnail: '',
      duration: 0,
      platform: validation.platform
    };
    
    if (infoResult.success) {
      try {
        const info = JSON.parse(infoResult.output);
        mediaInfo = {
          title: info.title || mediaInfo.title,
          description: info.description || '',
          author: info.uploader || info.channel || 'Desconhecido',
          thumbnail: info.thumbnail || '',
          duration: info.duration || 0,
          platform: validation.platform,
          view_count: info.view_count || 0,
          like_count: info.like_count || 0,
          upload_date: info.upload_date || ''
        };
      } catch (parseError) {
        console.warn('Failed to parse media info JSON:', parseError);
      }
    }
    
    res.json({
      success: true,
      download_url: downloadUrl,
      media_info: mediaInfo,
      supported_formats: validation.platform === 'youtube' ? ['mp4', 'mp3', 'webm'] : ['mp4', 'mp3']
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Platform status
app.get('/status', (req, res) => {
  res.json({
    youtube: {
      supported: true,
      status: 'operational',
      formats: ['mp4', 'mp3', 'webm']
    },
    instagram: {
      supported: true,
      status: 'operational',
      formats: ['mp4', 'mp3']
    },
    tiktok: {
      supported: true,
      status: 'operational',
      formats: ['mp4', 'mp3']
    },
    facebook: {
      supported: true,
      status: 'operational',
      formats: ['mp4', 'mp3']
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 YT-DLP Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Railway YT-DLP Social Media Downloader API`);
});

module.exports = app;