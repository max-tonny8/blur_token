/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true, // https://github.com/vercel/next.js/issues/9209#issuecomment-817214040
  },
};

module.exports = nextConfig;
