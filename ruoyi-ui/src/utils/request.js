import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

// 创建 axios 实例
const service = axios.create({
  // 请求前缀：开发环境走 vite 代理，生产环境走 nginx 反向代理
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 15000
})

// 请求拦截器：自动携带 JWT 令牌
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    // 登录、注册、验证码等匿名接口通过 skipAuth 跳过令牌
    if (token && !config.skipAuth) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRelogin = false

function handleUnauthorized() {
  if (isRelogin) {
    return
  }
  isRelogin = true
  ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      removeToken()
      window.location.hash = '#/login'
      window.location.reload()
    })
    .catch(() => {})
    .finally(() => {
      isRelogin = false
    })
}

// 响应拦截器：统一处理后端 AjaxResult 结构
service.interceptors.response.use(
  (response) => {
    // 文件流直接返回
    const responseType = response.request && response.request.responseType
    if (responseType === 'blob' || responseType === 'arraybuffer') {
      return response.data
    }

    const res = response.data
    // 后端未按 AjaxResult 返回时（如静态资源），原样透传
    if (res == null || typeof res.code === 'undefined') {
      return res
    }

    const code = res.code
    const msg = res.msg || '系统未知错误，请反馈给管理员'

    if (code === 200) {
      return res
    }
    if (code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(msg))
    }
    ElMessage({ message: msg, type: 'error', duration: 3000 })
    return Promise.reject(new Error(msg))
  },
  (error) => {
    let message = error.message || '请求失败'

    if (message === 'Network Error') {
      message = '后端接口连接异常，请确认 RuoYi 服务已启动在 8080 端口'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (/Request failed with status code/.test(message)) {
      const status = message.slice(-3)
      if (status === '401') {
        handleUnauthorized()
        return Promise.reject(new Error('登录状态已过期'))
      }
      message = '系统接口异常（HTTP ' + status + '）'
    }

    ElMessage({ message, type: 'error', duration: 3000 })
    return Promise.reject(error)
  }
)

export default service
