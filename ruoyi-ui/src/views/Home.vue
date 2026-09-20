<template>
  <div class="home">
    <header class="home__header">
      <div class="home__brand">
        <div class="brand-logo">若</div>
        <div>
          <h1>若依管理系统</h1>
          <p>登录成功，以下数据来自 <code>GET /getInfo</code></p>
        </div>
      </div>
      <el-button :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
    </header>

    <main v-loading="loading" class="home__body">
      <el-card shadow="never" class="home__card">
        <template #header>
          <div class="card-title">
            <el-icon><UserFilled /></el-icon>
            <span>当前登录用户</span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">
            {{ user.userName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ user.nickName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ (user.dept && user.dept.deptName) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号码">
            {{ user.phonenumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ user.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <el-tag :type="user.status === '0' ? 'success' : 'danger'" size="small">
              {{ user.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ user.createTime || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="home__card">
        <template #header>
          <div class="card-title">
            <el-icon><Key /></el-icon>
            <span>角色与权限</span>
          </div>
        </template>

        <div class="tag-group">
          <span class="tag-group__label">角色：</span>
          <template v-if="roles.length">
            <el-tag v-for="r in roles" :key="r" type="primary" effect="plain" class="tag-item">
              {{ r }}
            </el-tag>
          </template>
          <span v-else class="tag-group__empty">未分配角色</span>
        </div>

        <div class="tag-group">
          <span class="tag-group__label">权限标识：</span>
          <template v-if="permissions.length">
            <el-tag
              v-for="p in permissions"
              :key="p"
              type="success"
              effect="plain"
              class="tag-item"
            >
              {{ p }}
            </el-tag>
          </template>
          <span v-else class="tag-group__empty">暂无权限标识</span>
        </div>
      </el-card>

      <el-alert
        v-if="!roles.length"
        title="当前账号尚未分配角色"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          自助注册的账号默认不带角色，登录后菜单为空。请联系管理员在【系统管理 → 用户管理 → 分配角色】中
          为其分配「普通角色」，再重新登录即可看到菜单。
        </template>
      </el-alert>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Key, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const user = ref({})
const roles = ref([])
const permissions = ref([])

async function loadInfo() {
  loading.value = true
  try {
    const res = await userStore.getInfo()
    user.value = res.user || {}
    roles.value = res.roles || []
    permissions.value = res.permissions || []
  } catch (e) {
    // 令牌失效时拦截器会引导重新登录
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '系统提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await userStore.logOut()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

onMounted(() => {
  loadUserThenInfo()
})

async function loadUserThenInfo() {
  if (!userStore.user) {
    await loadInfo()
  } else {
    user.value = userStore.user
    roles.value = userStore.roles
    permissions.value = userStore.permissions
    loading.value = false
  }
}
</script>

<style scoped>
.home {
  min-height: 100%;
  padding: 24px;
  background: var(--ry-bg);
}

.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.06);
}

.home__brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.home__brand .brand-logo {
  width: 44px;
  height: 44px;
  margin: 0;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(160deg, #2f6fd0, #4bb8b0);
  border-radius: 12px;
}

.home__brand h1 {
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 600;
}

.home__brand p {
  margin: 0;
  font-size: 12px;
  color: var(--ry-text-sub);
}

.home__brand code {
  padding: 1px 5px;
  font-family: Consolas, Monaco, monospace;
  background: #f0f2f5;
  border-radius: 4px;
}

.home__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1040px;
  margin: 0 auto;
}

.home__card {
  border-radius: 14px;
}

.card-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.tag-group:last-child {
  margin-bottom: 0;
}

.tag-group__label {
  font-size: 13px;
  color: var(--ry-text-sub);
}

.tag-group__empty {
  font-size: 13px;
  color: #b0b7c3;
}

.tag-item {
  margin: 0;
}
</style>
