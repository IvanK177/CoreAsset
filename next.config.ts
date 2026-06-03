import type { NextConfig } from "next";
import dns from "dns";

// Local development network workarounds (bypasses DNS issues & SSL decryption firewalls in RU networks)
if (process.env.NODE_ENV === "development") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    console.warn("Failed to set DNS servers:", e);
  }
  process.env.NODE_USE_SYSTEM_CA = "1";
}

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
  async rewrites() {
    return [
      {
        source: "/supabase-proxy/:path*",
        destination: "https://tmivtbessykjksntdcwl.supabase.co/:path*",
      },
    ];
  },
};

export default nextConfig;
