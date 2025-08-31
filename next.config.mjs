/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configurações para hot reload
  reactStrictMode: true,
  
  // Configurações específicas de desenvolvimento
  experimental: {
    // Habilitar hot reload mais agressivo
    optimizeCss: false,
    esmExternals: true,
    // Força fast refresh
    forceSwcTransforms: false,
  },
  
  // Configurações do servidor de desenvolvimento
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Webpack config para hot reload
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

export default nextConfig
