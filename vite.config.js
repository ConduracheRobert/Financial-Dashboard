import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Import plugin-ul de PWA
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // Configurez setările pentru aplicația mea instalabilă
    VitePWA({
      registerType: 'autoUpdate', 
      
      // 1. FORȚEZ aplicația să se comporte ca un PWA chiar și în mediul de dezvoltare
      devOptions: {
        enabled: true
      },
      
      manifest: {
        name: 'Financial Dashboard', 
        short_name: 'FinDash', 
        description: 'Aplicația mea de licență pentru monitorizarea cheltuielilor',
        theme_color: '#42B983', 
        background_color: '#ffffff',
        display: 'standalone', 
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})