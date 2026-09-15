import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// The original scaffold's Base44 dev-tooling plugin has been removed —
// it called an undefined `base44()` function (a leftover from the Base44
// platform's own hosting/dev tooling) which would fail on any real build.
// This app now runs standalone against Supabase + Netlify Functions.
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      // App code lives at the repo root (not under src/), so "@/" resolves here.
      '@': rootDir,
    },
  },
});
