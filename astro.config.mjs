import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aetherwing.net',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  }
});
