<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- 左侧品牌区 -->
      <aside class="auth-card__brand">
        <div class="brand-logo">若</div>
        <h1 class="brand-title">若依管理系统</h1>
        <p class="brand-sub">RuoYi-Vue · 前后端分离快速开发平台</p>
        <ul class="brand-points">
          <li>
            <el-icon><Platform /></el-icon>
            <span>Spring Boot + Vue 3 技术栈</span>
          </li>
          <li>
            <el-icon><Lock /></el-icon>
            <span>JWT 令牌鉴权，无状态会话</span>
          </li>
          <li>
            <el-icon><UserFilled /></el-icon>
            <span>支持自助注册，管理员审核启用</span>
          </li>
        </ul>
      </aside>

      <!-- 右侧表单区 -->
      <section class="auth-card__form">
        <header class="form-head">
          <h2>欢迎回来</h2>
          <p>请使用您的账号登录系统</p>
        </header>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          size="large"
          label-position="top"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入计算结果"
                :prefix-icon="Key"
              />
              <div class="captcha-img" title="点击刷新验证码" @click="getCode">
                <img v-if="codeUrl" :src="codeUrl" alt="验证码" />
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <footer class="form-foot">
          <span>还没有账号？</span>
          <el-link type="primary" :underline="false" @click="goRegister">立即注册</el-link>
        </footer>

        <div v-if="backendOffline" class="demo-tip offline-tip">
          后端未连接：请启动 <b>ruoyi-admin</b>，并确保 MySQL 与 Redis 已运行。
        </div>
        <div v-else-if="!captchaEnabled" class="demo-tip">
          当前系统已<b>关闭验证码</b>，可直接输入账号密码登录。
        </div>
        <div v-else class="demo-tip">
          默认管理员账号 <b>admin</b> / 密码 <b>admin123</b>；自助注册的账号需管理员审核启用后方可登录。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Loading, Platform, UserFilled } from '@element-plus/icons-vue'
import { getCodeImg } from '@/api/login'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const captchaEnabled = ref(true)
const backendOffline = ref(false)
const codeUrl = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  uuid: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入您的用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入您的密码', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

/** 获取图形验证码 */
async function getCode() {
  try {
    const res = await getCodeImg()
    backendOffline.value = false
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = 'data:image/gif;base64,' + res.img
      loginForm.uuid = res.uuid
      loginForm.code = ''
    }
  } catch (e) {
    codeUrl.value = ''
    backendOffline.value = true
  }
}

/** 提交登录 */
function handleLogin() {
  if (backendOffline.value) {
    ElMessage.warning('后端服务未连接，请先启动 ruoyi-admin')
    return
  }
  loginFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    try {
      await userStore.login(loginForm)
      const redirect = route.query.redirect || '/index'
      ElMessage.success('登录成功')
      router.push(redirect)
    } catch (e) {
      // 错误提示已由 axios 拦截器统一弹出，这里只需刷新验证码
      if (captchaEnabled.value) {
        getCode()
      }
    } finally {
      loading.value = false
    }
  })
}

function goRegister() {
  router.push('/register')
}

onMounted(() => {
  getCode()
})
</script>

<style scoped>
.offline-tip {
  color: #b13a3a;
  background: #fef0f0;
  border-color: #fbc4c4;
}

.offline-tip b {
  color: #d32f2f;
}
</style>
