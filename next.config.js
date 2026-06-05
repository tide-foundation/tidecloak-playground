   // Set reactStrictMode to false to test initialisation and avoid realm being attempted to create twice in development mode.

   /** @type {import('next').NextConfig} */
   export default {
    reactStrictMode: false,
    transpilePackages: ['react-icons'],
    // The @tidecloak SDK resolves its config (and DPoP setup) from /adapter.json
    // by default. This app stores the client adapter in data/tidecloak.json and
    // serves it via /api/tidecloakConfig, so map /adapter.json onto that route.
    async rewrites() {
      return [
        { source: '/adapter.json', destination: '/api/tidecloakConfig' },
      ];
    },
  }
