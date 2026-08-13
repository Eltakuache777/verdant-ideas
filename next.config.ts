import type { NextConfig } from "next";

// NEXT_PUBLIC_APP_URL is inlined at build time and used to build robots.txt,
// sitemap.xml, and canonical/OG URLs. Missing it in a production build bakes
// "http://localhost:3000" into all of those permanently — nothing at runtime
// can fix it after the fact, so warn loudly here instead of shipping it silently.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL) {
  console.warn(
    "\n⚠️  NEXT_PUBLIC_APP_URL is not set for this production build.\n" +
      "   robots.txt, sitemap.xml, and Open Graph/canonical URLs will point at http://localhost:3000\n" +
      "   until this is set and the app is rebuilt. Set it to your real deployed URL.\n"
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
