<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- 左侧品牌区 -->
      <aside class="auth-card__brand">
        <div class="brand-logo">若</div>
        <h1 class="brand-title">创建新账号</h1>
        <p class="brand-sub">注册后需由管理员审核启用，通过后方可登录系统</p>
        <ul class="brand-points">
          <li>
            <el-icon><EditPen /></el-icon>
            <span>用户名 2 ~ 20 个字符</span>
          </li>
          <li>
            <el-icon><Key /></el-icon>
            <span>密码 5 ~ 20 个字符</span>
          </li>
          <li>
            <el-icon><CircleCheck /></el-icon>
            <span>提交后进入待审核状态</span>
          </li>
        </ul>
      </aside>

      <!-- 右侧表单区 -->
      <section class="auth-card__form">
        <header class="form-head">
          <h2>用户注册</h2>
          <p>请填写以下信息完成注册</p>
        </header>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          size="large"
          label-position="top"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（2~20 字符）"
              :prefix-icon="User"
              clearable
              maxlength="20"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（5~20 字符）"
              :prefix-icon="Lock"
              show-password
              maxlength="20"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :prefix-icon="Lock"
              show-password
              maxlength="20"
            />
          </el-form-item>

          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="captcha-row">
              <el-input
                v-model="registerForm.code"
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
              @click="handleRegister"
            >
              {{ loading ? '提交中' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <footer class="form-foot">
          <span>已有账号？</span>
          <el-link type="primary" :underline="false" @click="goLogin">返回登录</el-link>
        </footer>

        <div v-if="backendOffline" class="demo-tip offline-tip">
          后端未连接：请先启动 <b>ruoyi-admin</b>（8080 端口）。
        </div>
        <div v-else class="demo-tip">
          注册后账号为 <b>待审核</b> 状态，需管理员在
          <code>用户管理</code> 中启用后方可登录。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Lock,
  Key,
  Loading,
  EditPen,
  CircleCheck
} from '@element-plus/icons-vue'
import { getCodeImg, register } from '@/api/login'

const router = useRouter()

const registerFormRef = ref(null)
const loading = ref(false)
const captchaEnabled = ref(true)
const backendOffline = ref(false)
const codeUrl = ref('')

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: ''
})

/** 与后端 SysRegisterService 的校验规则保持一致 */
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度必须在 2 到 20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度必须在 5 到 20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
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
      registerForm.uuid = res.uuid
      registerForm.code = ''
    }
  } catch (e) {
    codeUrl.value = ''
    backendOffline.value = true
  }
}

/** 提交注册 */
function handleRegister() {
  if (backendOffline.value) {
    ElMessage.warning('后端服务未连接，请先启动 ruoyi-admin')
    return
  }
  registerFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    try {
      await register({
        username: registerForm.username.trim(),
        password: registerForm.password,
        code: registerForm.code,
        uuid: registerForm.uuid
      })

      await ElMessageBox.alert(
        `账号「${registerForm.username.trim()}」注册成功！\n\n` +
          '该账号当前处于待审核状态，请联系管理员在【系统管理 → 用户管理】中将其启用后再登录。',
        '注册成功',
        {
          confirmButtonText: '返回登录',
          type: 'success',
          draggable: true
        }
      )
      router.push('/login')
    } catch (e) {
      // 注册失败刷新验证码，错误提示由拦截器统一处理
      if (captchaEnabled.value) {
        getCode()
      }
    } finally {
      loading.value = false
    }
  })
}

function goLogin() {
  router.push('/login')
}

onMounted(() => {
  getCode()
})
</script>

<style scoped>
.auth-card__form .el-form-item {
  margin-bottom: 16px;
}

.form-head {
  margin-bottom: 18px;
}

.offline-tip {
  color: #b13a3a;
  background: #fef0f0;
  border-color: #fbc4c4;
}

.offline-tip b {
  color: #d32f2f;
}

.demo-tip code {
  padding: 1px 5px;
  font-family: Consolas, Monaco, monospace;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>
