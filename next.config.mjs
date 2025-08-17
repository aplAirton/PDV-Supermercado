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
  // Permite que o servidor dev aceite requests vindos do origin de rede
  // Inclui localhost e as portas 3000/3001 para cobrir quando o servidor muda de porta
  allowedDevOrigins: [
    "http://192.168.0.10:3000",
    "http://192.168.0.10:3001",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
}

export default nextConfig
