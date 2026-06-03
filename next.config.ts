import type { NextConfig } from "next";
import dns from "dns";

// Override DNS resolution to bypass slow/broken local system DNS (e.g. xbox-dns.ru)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Failed to set DNS servers:", e);
}

// Use the Windows System Certificate Store to trust local/corporate CA certificates (prevents ECONNRESET from firewalls/inspectors)
process.env.NODE_USE_SYSTEM_CA = "1";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
