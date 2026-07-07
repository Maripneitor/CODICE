import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://lh3.googleusercontent.com; connect-src 'self' http://localhost:3001 https://dpg-d93kqnvaqgkc73c5s4d0-a.ohio-postgres.render.com http://10.0.2.2:3000 http://10.0.2.2:3001; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
