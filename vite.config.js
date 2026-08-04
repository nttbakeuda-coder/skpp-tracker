import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Jangan awasi berkas PDF di folder aset. Pada Windows/OneDrive, berkas
      // yang sedang tersinkron kadang terkunci -> watcher Vite crash (EBUSY)
      // dan menjatuhkan dev server. PDF di sini statis, tak perlu HMR.
      ignored: ['**/public/regulasi/**', '**/public/panduan/**', '**/*.pdf'],
    },
  },
})
