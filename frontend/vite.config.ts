import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3007,
    host: '0.0.0.0',
    strictPort: true,
    // Comma-separated hostnames, set where the app runs (e.g. the Pi) so
    // private names stay out of this public repo. preview.allowedHosts inherits this.
    allowedHosts: process.env.ALLOWED_HOSTS?.split(','),
  },
  preview: {
    port: 3007,
    host: '0.0.0.0',
    strictPort: true
  }
})
