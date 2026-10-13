import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The flat list of materias became the browsing steps (change alcance-por-facultad).
      { source: '/materias', destination: '/universidades', permanent: true },
    ];
  },
};

export default nextConfig;
