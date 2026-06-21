/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
    serverComponentsExternalPackages: ["sharp"],
    outputFileTracingExcludes: {
      "*": [
        ".next/cache/**",
        "./node_modules/@img/sharp-libvips-linuxmusl-x64/**",
        "./node_modules/@img/sharp-linuxmusl-x64/**",
      ],
    },
  },
  images: {
    // User-uploaded book photos go to S3-compatible object storage.
    // For dev we allow localhost-served URLs.
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
