/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Este é o ID do seu projeto Supabase que apareceu no erro
        hostname: 'oeclpwdarhkahtravihi.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com', // Para o avatar gerado automaticamente
        port: '',
        pathname: '/api/**',
      },
    ],
  },
}

module.exports = nextConfig