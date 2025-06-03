/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes
  // output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  env: {
    // Fallback for API URL if not set in environment
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api'
  }
}

module.exports = nextConfig