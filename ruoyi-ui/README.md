# ruoyi-ui · 登录 / 注册前端

RuoYi-Vue 3.9.2 的**独立轻量前端**，只做「注册 + 登录 + 登录后信息展示」这条链路。
不依赖官方 ruoyi-ui，无框架级脚手架负担，开箱即跑。

技术栈：Vue 3 + Vite + Element Plus + Pinia + Vue Router + Axios。

---

## 一、它对接了哪些后端接口

| 功能 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 图形验证码 | GET | `/captchaImage` | 返回 `{ captchaEnabled, uuid, img(base64) }` |
| 登录 | POST | `/login` | body `{ username, password, code, uuid }`，返回 `token` |
| 注册 | POST | `/register` | body `{ username, password, code, uuid }` |
| 当前用户信息 | GET | `/getInfo` | 需请求头 `Authorization: Bearer <token>` |
| 退出登录 | POST | `/logout` | 清除服务端令牌缓存 |

以上接口在 `SecurityConfig` 中均已放行匿名访问（`/login`、`/register`、`/captchaImage`）。

---

## 二、启动步骤

### 1. 准备后端依赖

- MySQL：导入 `../sql/ry_20260417.sql`（若尚未导入）
- Redis：默认 `localhost:6379`，无密码

### 2. 开启注册开关（关键）

后端注册接口有开关校验，默认是**关闭**的。执行：

```bash
mysql -u root -p ry-vue < ../sql/register_patch.sql
```

等价于：

```sql
UPDATE sys_config SET config_value = 'true' WHERE config_key = 'sys.account.registerUser';
```

> 若依把参数缓存在 Redis（前缀 `sys_config:`）。改库后开关没生效的话，
> 到【系统管理 → 参数设置】点一下「**刷新缓存**」，或者直接重启后端。

### 3. 启动后端

```bash
cd ..
mvn clean package -DskipTests
java -jar ruoyi-admin/target/ruoyi-admin.jar
```

或直接在 IDE 里运行 `com.ruoyi.RuoYiApplication`。默认端口 **8080**。

### 4. 启动前端

```bash
cd ruoyi-ui
npm install
npm run dev
```

浏览器打开 **http://localhost:5173**

> 开发环境下 `/dev-api` 由 Vite 代理到 `http://localhost:8080`，无需处理跨域。
> 后端不在本机时，改 `.env.development` 里的 `VITE_APP_PROXY_TARGET`。

---

## 三、注册后的账号是什么状态

按需求实现为「**注册后可登录但需审核**」：

1. 用户提交注册 → 写入 `sys_user`，其中
   - `status = '1'`（停用）
   - `remark = '自助注册用户，待管理员审核启用'`
   - `create_by = 用户名`
2. 此时用该账号登录，会被 `UserDetailsServiceImpl` 拦截，提示
   **「用户已停用或尚未通过审核，请联系管理员」**
3. 管理员在【系统管理 → 用户管理】将其**状态改为正常**后，才能成功登录。

改动位置：`ruoyi-framework/.../service/SysRegisterService.java`

```java
// 自助注册用户默认置为「停用」状态，需管理员审核启用后才能登录
sysUser.setStatus(UserStatus.DISABLE.getCode());
sysUser.setCreateBy(username);
sysUser.setRemark("自助注册用户，待管理员审核启用");
```

---

## 四、目录结构

```
ruoyi-ui/
├── index.html
├── vite.config.js            # 别名 @ + /dev-api 代理
├── .env.development          # 开发环境变量
├── .env.production           # 生产环境变量
└── src/
    ├── main.js               # 入口，注册 Element Plus 与全量图标
    ├── App.vue
    ├── api/login.js          # 接口定义
    ├── router/index.js       # 路由 + 登录守卫（hash 模式）
    ├── store/user.js         # Pinia：token / 用户信息 / 权限
    ├── utils/
    │   ├── auth.js           # token 读写（localStorage）
    │   └── request.js        # axios 封装：自动带 token、统一错误提示、401 重登
    ├── styles/index.css      # 全局样式 + 登录/注册外壳样式
    └── views/
        ├── Login.vue         # 登录页
        ├── Register.vue      # 注册页
        └── Home.vue          # 登录后首页（展示 getInfo 结果）
```

---

## 五、生产打包

```bash
npm run build          # 产物在 dist/
```

Nginx 参考配置：

```nginx
server {
    listen       80;
    server_name  your-domain.com;

    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    location /prod-api/ {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:8080/;
    }
}
```

路由使用 **hash 模式**，即使不做 `try_files` 回退也能正常刷新。

---

## 六、常见问题

| 现象 | 原因 / 解决 |
| --- | --- |
| 页面提示「无法连接后端服务」 | 后端没起，或端口不是 8080。核对 `VITE_APP_PROXY_TARGET` |
| 注册报「当前系统没有开启注册功能！」 | `sys.account.registerUser` 还是 `false`，或 Redis 缓存未刷新 |
| 登录报「用户已停用或尚未通过审核」 | 正常，去用户管理把该账号状态改为「正常」 |
| 登录成功但首页菜单为空 | 注册用户没有角色。在用户管理里分配「普通角色」(role_id=2) |
| 验证码图片不显示 | Redis 没起来，验证码存在 Redis 里 |
| 忘记 admin 密码 | 初始密码 `admin123`；或后台执行 `UPDATE sys_user SET password='$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2' WHERE user_name='admin'`（该哈希即对应 `admin123`） |
