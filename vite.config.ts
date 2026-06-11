import { defineConfig } from 'vite';

export default defineConfig({
  base: '/portaldocliente/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false,
    watch: null
  }
});
