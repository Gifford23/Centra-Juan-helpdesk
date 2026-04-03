import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'technician.png'], // Assets to pre-cache
      manifest: {
        name: 'Central Juan Helpdesk',
        short_name: 'CJ Helpdesk',
        description: 'Enterprise Ticketing and ERP System for Central Juan',
        theme_color: '#2563eb', // Matches your blue branding
        background_color: '#f4f8fc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Automatically cache JS, CSS, and HTML for faster load times
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,gif}']
      }
    })
  ],
});