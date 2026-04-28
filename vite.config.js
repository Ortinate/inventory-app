import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jsx}']
      },
      includeAssets: ['icon.png', 'favicon.svg'],
      manifest: {
        name: 'Stocky: Smart Inventory',
        short_name: 'Stocky',
        description: 'Your friendly offline inventory management scanner.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
