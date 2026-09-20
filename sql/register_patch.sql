-- =============================================================
--  若依 · 自助注册功能配套脚本
--  说明：后端 SysRegisterController 会先校验参数 sys.account.registerUser，
--        为 false 时直接返回「当前系统没有开启注册功能！」，因此必须打开开关。
-- =============================================================

-- 1) 打开自助注册开关
UPDATE sys_config SET config_value = 'true' WHERE config_key = 'sys.account.registerUser';

-- 2) 【可选】本地调试时关闭图形验证码，省去每次输入
-- UPDATE sys_config SET config_value = 'false' WHERE config_key = 'sys.account.captchaEnabled';

-- 3) 校验结果
SELECT config_id, config_name, config_key, config_value
FROM sys_config
WHERE config_key IN ('sys.account.registerUser', 'sys.account.captchaEnabled');

-- 注意：若依会把参数缓存在 Redis（key 前缀 sys_config:）。
--       直接改库后若开关不生效，请到【系统管理 -> 参数设置】点击「刷新缓存」，
--       或直接重启后端服务。

-- =============================================================
--  管理员审核操作（注册用户默认 status = '1' 停用，启用后才能登录）
-- =============================================================

-- 查看待审核的注册用户
SELECT user_id, user_name, nick_name, status, remark, create_time
FROM sys_user
WHERE remark = '自助注册用户，待管理员审核启用'
ORDER BY create_time DESC;

-- 审核通过：启用账号
-- UPDATE sys_user SET status = '0' WHERE user_name = 'zhangsan';

-- 审核不通过：保持 status = '1'（停用），登录时会被拦截并提示
--   「用户已停用或尚未通过审核，请联系管理员」

-- 【重要】自助注册的账号默认不写 sys_user_role，无任何角色，登录后菜单为空。
--   如需让其看到菜单，请分配角色：
-- 方式一：系统管理 -> 用户管理 -> 编辑用户 -> 分配「普通角色」
-- 方式二：直接写关联表（role_id = 2 为若依内置「普通角色」）
-- INSERT INTO sys_user_role(user_id, role_id)
-- SELECT u.user_id, 2 FROM sys_user u
-- WHERE u.user_name = 'zhangsan'
--   AND NOT EXISTS (SELECT 1 FROM sys_user_role r WHERE r.user_id = u.user_id AND r.role_id = 2);
