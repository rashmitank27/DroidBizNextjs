/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for better performance
  output: 'standalone',
  
  // Image optimization settings
  images: {
    domains: ['your-domain.com'], // Add your image domains here
    unoptimized: false, // Set to true if you want to disable image optimization
  },
  
  // Webpack configuration to handle Excel files
  webpack: (config, { isServer }) => {
    // Add support for reading files in the data directory
    if (isServer) {
      config.externals.push({
        'fs': 'commonjs fs',
        'path': 'commonjs path'
      });
    }
    
    return config;
  },
  
  // Compress responses
  compress: true,
  
  // Environment variables (if needed)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets for longer
      {
        source: '/data/excel/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;