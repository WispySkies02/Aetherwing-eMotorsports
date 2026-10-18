import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aetherwing.net',
  trailingSlash: 'always',
  vite: {
    plugins: [{
      name: 'aetherwing-directory-indexes',
      apply: 'serve',
      enforce: 'post',
      configureServer(server) {
        // Vite does not resolve public directory indexes like Netlify does.
        // Keep the canonical Admin URL and its login query/hash unchanged.
        // Astro installs its slash check in a post hook. Normalize these local
        // aliases ahead of that check after its middleware has been installed.
        return () => server.middlewares.stack.unshift({route:'',handle(request, _response, next) {
          const url = new URL(request.url || '/', 'http://localhost');
          if (url.pathname === '/admin/') request.url = `/admin/index.html${url.search}`;
          // Match directory-style production links, including shared #full URLs
          // whose fragments stay in the browser and are not sent to the server.
          if (/^\/schedule(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(url.pathname)) request.url = `${url.pathname}/${url.search}`;
          next();
        }});
      }
    }]
  },
  build: {
    format: 'directory'
  }
});
