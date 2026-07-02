import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: path.resolve(__dirname, 'proyectos/mediapipe-lab'),
  server: {
    port: 5174,
    open: false
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          mediapipe: ['@mediapipe/tasks-vision', '@mediapipe/pose', '@mediapipe/hands', '@mediapipe/holistic']
        }
      }
    }
  }
})
