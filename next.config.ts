import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Notifications (gps-engine SSE stream) are connected to directly from
      // the browser, not proxied here — Next's response compression buffers
      // the low-throughput SSE chunks and breaks real-time delivery. See
      // lib/api.ts's NOTIFICATION_URL.
      {
        source: "/api/:path*",
        destination: "http://138.252.201.46:6003/:path*",
        // destination: "http://localhost:6003/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
