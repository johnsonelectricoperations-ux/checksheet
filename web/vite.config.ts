import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA 설정: 오프라인 우선(앱 셸 캐싱). 데이터 동기화는 별도 구현(3단계).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            // 참조용 미디어: 한 번 열어보면 캐시되어 오프라인에서도 참고 가능
            urlPattern: /\/api\/files\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'guide-files',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: '현장 점검시트',
        short_name: '점검시트',
        description: '현장 점검시트 작성 및 동기화',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1565c0',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    host: true, // 사내망의 다른 기기(태블릿)에서 접속 가능하게
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
