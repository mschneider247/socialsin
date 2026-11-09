import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js (the D20, src/dice/d20Scene.ts) is one ~530 kB chunk on its
    // own, loaded after the page is up.
    chunkSizeWarningLimit: 600,
  },
})
