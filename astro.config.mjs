import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aetherwing.net',
  trailingSlash: 'always',
  vite: {
    plugins: [{
      name: 'aetherwing-admin-index',
      apply: 'serve',
      configureServer(server) {
        // Vite does not resolve public directory indexes like Netlify does.
        // Keep the canonical Admin URL and its login query/hash unchanged.
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url || '/', 'http://localhost');
          if (url.pathname === '/admin/') request.url = `/admin/index.html${url.search}`;
          next();
        });
      }
    }]
  },
  build: {
    format: 'directory'
  }
});
