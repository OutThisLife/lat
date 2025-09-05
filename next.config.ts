import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    rules: {
      '*.fs': {
        as: '*.js',
        loaders: ['raw-loader']
      },
      '*.glsl': {
        as: '*.js',
        loaders: ['raw-loader']
      },
      '*.vs': {
        as: '*.js',
        loaders: ['raw-loader']
      }
    }
  },
  webpack: cfg => ({
    ...cfg,
    module: {
      ...cfg.module,
      rules: [
        ...cfg.module.rules,
        {
          test: /\.(glsl|vs|fs)$/,
          use: ['raw-loader']
        }
      ]
    }
  })
}

export default nextConfig
