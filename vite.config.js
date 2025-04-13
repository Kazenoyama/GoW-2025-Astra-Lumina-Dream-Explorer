import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? "/GoW-2025-Astra-Lumina-Dream-Explorer/" 
    : "/",
  
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  },
  
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Access-Control-Allow-Origin': '*'
    }
  },
});
