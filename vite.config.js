import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/auth.config.json', '**/local.config.json', '**/archive/**', '**/persona/**', '**/Emotion/**', '**/emotion/**', '**/chats/**', '**/runtime/**'] },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});
