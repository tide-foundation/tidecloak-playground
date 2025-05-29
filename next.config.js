   // Set reactStrictMode to false to test initialisation and avoid realm being attempted to create twice in development mode.

   /** @type {import('next').NextConfig} */
   export default {
    reactStrictMode: false,
    transpilePackages: ['react-icons'],
    webpack(config, { isServer }) {
      // 1. Teach webpack to recognise `.mjs`
      config.resolve.extensions.push('.mjs');

      // 2. Force `.mjs` in node_modules to be parsed as JS
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      });

      return config;
    },
  }
