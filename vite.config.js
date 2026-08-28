import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split stable vendors into their own chunks so framework code isn't
        // re-downloaded when only app code changes. three is already split by
        // the dynamic import in utils/three-helpers.js, so we leave it alone
        // and only group the rest by package.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('react')) return 'react'
          }
        },
      },
    },
  },
})
