// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/memos-api': {
          target: 'https://memo.liaoguoyin.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/memos-api/, ''),
        },
      },
    },
  },
});
