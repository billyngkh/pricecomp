/** @type {import('next').NextConfig} */


const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable default image optimization
  },
  assetPrefix: isProd ? '/pricecomp/' : '',
  basePath: isProd ? '/pricecomp' : '',
  output: 'export' // Enable static export
};

export default nextConfig;