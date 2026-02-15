import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

const isDocker = process.env.DOCKER === 'true'

export default defineConfig({
  plugins: [
    react(),
    ...(!isDocker ? [electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the main-process to reload the app when this file is changed
          options.reload()
        },
      },
    ])] : []),
  ],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendors - always bundled
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@react-flow') || id.includes('node_modules/reactflow')) {
            return 'vendor-reactflow';
          }

          // Monaco editor - lazy loaded on demand
          if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
            return 'monaco-editor';
          }

          // xterm terminal - lazy loaded
          if (id.includes('node_modules/xterm')) {
            return 'xterm-vendor';
          }

          // Application-level code splitting
          if (id.includes('/CosmicMap/') || id.includes('cosmic')) {
            return 'cosmic-map';
          }
          if (id.includes('/FlowVisualization/')) {
            return 'flow-viz';
          }
        },
        // Optimize chunk naming for caching
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'reactflow'],
    exclude: ['monaco-editor', 'electron'],
  },
  // Ensure Monaco Editor workers are correctly loaded
  worker: {
    format: 'es',
  },
})
