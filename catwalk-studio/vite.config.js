import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(async ({ mode }) => {
  const plugins = [react()]

  if (mode === 'production') {
    // const Prerender = (await import('vite-plugin-prerender')).default
    // plugins.push(
    //   Prerender({
    //     staticDir: path.join(__dirname, 'dist'),
    //     routes: ['/', '/models', '/models/register'],
    //   })
    // )
  }

  return {
    plugins,
    server: {
      port: 3000
    },
    build: {
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Supabase in separate chunk
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      // Source maps for production debugging (optional)
      sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})
