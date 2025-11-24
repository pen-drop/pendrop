import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    cors: true,
  },
  plugins: [
    vue(),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        plugin: path.resolve(__dirname, 'src/plugin.ts'),
        index: path.resolve(__dirname, 'src/ui/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  publicDir: 'public',
});
