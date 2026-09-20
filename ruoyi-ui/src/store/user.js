import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getInfo as getInfoApi } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    user: null,
    roles: [],
    permissions: []
  }),

  getters: {
    nickName: (state) => (state.user && state.user.nickName) || '',
    userName: (state) => (state.user && state.user.userName) || ''
  },

  actions: {
    /**
     * 登录
     * @param {{username:string,password:string,code:string,uuid:string}} userInfo
     */
    async login(userInfo) {
      const res = await loginApi(
        userInfo.username.trim(),
        userInfo.password,
        userInfo.code,
        userInfo.uuid
      )
      setToken(res.token)
      this.token = res.token
      return res
    },

    /** 拉取当前用户信息与权限 */
    async getInfo() {
      const res = await getInfoApi()
      this.user = res.user
      this.roles = res.roles && res.roles.length ? res.roles : ['ROLE_DEFAULT']
      this.permissions = res.permissions || []
      return res
    },

    /** 退出登录 */
    async logOut() {
      try {
        await logoutApi()
      } catch (e) {
        // 令牌已失效时忽略后端异常，本地照常清理
      }
      this.token = ''
      this.user = null
      this.roles = []
      this.permissions = []
      removeToken()
    }
  }
})
