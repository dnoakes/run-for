import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
      await setupDevPlatform();
    } catch (e) {
      console.warn("Failed to load Cloudflare dev platform:", e);
    }
  })();
}

export default nextConfig;
