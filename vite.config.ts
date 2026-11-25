import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  publicDir: false,
  build: { assetsInlineLimit: 0 },
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0-preview.1'),
    __BUILD_SHA__: JSON.stringify(process.env.VITE_BUILD_SHA || 'local'),
  },
});
