import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  base: '/vvtree/',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: 'preserve',
          isCustomElement: tag => tag.includes('-')
        }
      }
    }),
    tailwindcss(),
  ],
})
