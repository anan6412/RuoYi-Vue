import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

/** 把字符串转义为可安全用于正则的片段 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir)
  const baseApi = env.VITE_APP_BASE_API || '/dev-api'
  const proxyTarget = env.VITE_APP_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      proxy: {
        // 开发环境把 /dev-api 前缀代理到若依后端，规避浏览器跨域
        [baseApi]: {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp('^' + escapeRegExp(baseApi)), '')
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      proxy: {
        // 预览构建产物时同样代理，方便不启 dev server 也能联调
        '/prod-api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp('^/prod-api'), '')
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000
    }
  }
})
