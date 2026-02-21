import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync } from 'fs'

const tauriConfPath = path.resolve(__dirname, '../desktop/src-tauri/tauri.conf.json')
const desktopVersion =
  (() => {
    try {
      const raw = readFileSync(tauriConfPath, 'utf-8')
      const json = JSON.parse(raw) as { version?: string }
      return json.version ?? '0.1.1'
    } catch {
      return '0.1.1'
    }
  })()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/daemon/',
  define: {
    'import.meta.env.VITE_DESKTOP_VERSION': JSON.stringify(desktopVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
