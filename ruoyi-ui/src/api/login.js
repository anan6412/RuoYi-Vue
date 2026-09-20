import request from '@/utils/request'

/**
 * 获取图形验证码
 * 后端：CaptchaController#getCode  ->  GET /captchaImage
 * 返回：{ code, msg, captchaEnabled, uuid, img }
 */
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    method: 'get',
    skipAuth: true,
    timeout: 20000
  })
}

/**
 * 用户登录
 * 后端：SysLoginController#login  ->  POST /login
 * 返回：{ code, msg, token }
 */
export function login(username, password, code, uuid) {
  return request({
    url: '/login',
    method: 'post',
    skipAuth: true,
    data: { username, password, code, uuid }
  })
}

/**
 * 用户注册
 * 后端：SysRegisterController#register  ->  POST /register
 * 前置条件：sys_config 中 sys.account.registerUser 必须为 true
 */
export function register(data) {
  return request({
    url: '/register',
    method: 'post',
    skipAuth: true,
    data
  })
}

/**
 * 获取当前登录用户信息
 * 后端：SysLoginController#getInfo  ->  GET /getInfo
 */
export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

/**
 * 退出登录
 * 后端：SecurityConfig 中 logoutUrl("/logout")
 */
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}
