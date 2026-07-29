/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: '/hire/hire-:slug', destination: '/templates/:slug-contract-template', permanent: true },
      { source: '/hire/:slug', destination: '/templates/:slug-contract-template', permanent: true },
      { source: '/posts/graphic-designer', destination: '/templates/freelance-graphic-designer-contract-template', permanent: true },
      { source: '/posts/web-developer-programmer', destination: '/templates/freelance-web-developer-contract-template', permanent: true },
      { source: '/posts/freelance-writer-copywriter', destination: '/templates/freelance-copywriter-contract-template', permanent: true },
      { source: '/posts/freelance-writing-and-blogging-yes-on-a-phone', destination: '/templates/freelance-copywriter-contract-template', permanent: true },
      { source: '/posts/social-media-management-and-content-creation', destination: '/templates/social-media-manager-contract-template', permanent: true },
      { source: '/posts/social-media-management-and-content-creation.html', destination: '/templates/social-media-manager-contract-template', permanent: true },
      { source: '/posts/virtual-assistance-and-customer-support', destination: '/templates/virtual-assistant-contract-template', permanent: true },
      { source: '/posts/virtual-assistant-executive-assistant', destination: '/templates/virtual-assistant-contract-template', permanent: true },
      { source: '/posts/photography-and-videography-smartphone-camera-gigs', destination: '/templates/freelance-videographer-contract-template', permanent: true },
      { source: '/posts/consulting-in-your-expertise-freelance-consultant-coach', destination: '/templates/consulting-agreement-contract-template', permanent: true },
      { source: '/posts/consulting-in-your-expertise-freelance-consultant-coach.html', destination: '/templates/consulting-agreement-contract-template', permanent: true },
      { source: '/posts/voice-acting-and-audio-services', destination: '/create', permanent: true },
      { source: '/tools/:slug*', destination: '/create', permanent: true },
      { source: '/posts/how-to-turn-freelance-clients-into-long-term-contracts.html', destination: '/dashboard', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/cookies', destination: '/privacy-policy', permanent: true },
      { source: '/about', destination: '/', permanent: true },
      { source: '/contact', destination: '/', permanent: true },
      { source: '/:path*.html', destination: '/', permanent: true },
      { source: '/posts/:slug*', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
