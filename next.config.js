/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase the webpack buffer size for asset processing
  webpack: (config) => {
    config.performance = {
      ...config.performance,
      maxAssetSize: 50 * 1024 * 1024, // 50MB in bytes
      maxEntrypointSize: 50 * 1024 * 1024, // 50MB in bytes
    };
    
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
    };
    
    return config;
  },
  experimental: {
    // Enable larger body size for API routes
    serverActions: {
      bodySizeLimit: '50mb',
    }
  }
};

module.exports = nextConfig;