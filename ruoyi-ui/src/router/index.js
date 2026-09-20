import { createRouter, createWebHashHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', anonymous: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', anonymous: true }
  },
  {
    path: '/index',
    name: 'Index',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/index'
  }
]

const router = createRouter({
  // 使用 hash 模式，部署时无需额外配置 nginx try_files
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const appTitle = import.meta.env.VITE_APP_TITLE || 'RuoYi'
  document.title = to.meta && to.meta.title ? `${to.meta.title} - ${appTitle}` : appTitle

  const hasToken = !!getToken()

  // 匿名页面：已登录用户访问登录/注册页时直接进首页
  if (to.meta && to.meta.anonymous) {
    if (hasToken && (to.path === '/login' || to.path === '/register')) {
      return next({ path: '/index' })
    }
    return next()
  }

  // 需要登录的页面
  if (!hasToken) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  next()
})

export default router
