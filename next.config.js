/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],

  // Build configuration
  output: 'standalone',
  poweredByHeader: false,
  generateEtags: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if your project has type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    domains: [
      'unpam.cloud',
      'github.com',
      'raw.githubusercontent.com',
      'opengraph.githubassets.com',
      'api2.sololearn.com',
      'images.unsplash.com',
      'picsum.photos',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features - removed optimizeCss
  experimental: {
    // Note: strictMode, serverComponents, and appDir are deprecated
    // Use reactStrictMode instead of strictMode
    // serverComponents and appDir are enabled by default in Next.js 13+
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers for security and performance
  async headers() {
    return [
      // Static chunk filenames are content-hashed only in production builds. In dev
      // mode they're stable, so an immutable year-long cache here makes the browser
      // permanently ignore any code change until the cache is manually cleared.
      ...(process.env.NODE_ENV === 'production' ? [{
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      }] : []),
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Performance headers
          {
            key: 'X-Powered-By',
            value: 'Angga Rakhmansyah'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          },
        ],
      },
      // The model pack's filename carries its content hash, so it never changes.
      {
        source: '/models/:file(world\\.[0-9a-f]+\\.glb)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=31536000'
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/github',
        destination: 'https://github.com/angga-syah',
        permanent: true,
      },
      {
        source: '/linkedin',
        destination: 'https://www.linkedin.com/in/angga-rakhmansyah-362463265',
        permanent: true,
      },
      {
        source: '/instagram',
        destination: 'https://www.instagram.com/al.rakhm/',
        permanent: true,
      },
      {
        source: '/email',
        destination: 'mailto:angga@muslim.com',
        permanent: true,
      },
      {
        source: '/resume',
        destination: '/sub/resume.html',
        permanent: false,
      },
    ];
  },

  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || 'https://unpam.cloud',
    SITE_NAME: 'Angga Rakhmansyah Portfolio',
    SITE_DESCRIPTION: 'Portfolio website of Angga Rakhmansyah - Computer Science Student & Web Developer',
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    
    // Add custom webpack plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(buildId),
        __DEV__: JSON.stringify(dev),
      })
    );

    // Note: previously this hook replaced Next's default splitChunks with a custom
    // vendor/common cacheGroups setup. That config disabled Next's built-in "framework"
    // cache group (which keeps react/react-dom/scheduler in one dedicated chunk) and let
    // react get duplicated across the custom "vendor" and "common" chunks instead —
    // two separate React module instances in production, which broke any library reading
    // React's internal shared state (react-three-fiber's reconciler, in this case) with
    // "Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')".
    // Left removed; Next's default splitChunks handles this correctly.

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;