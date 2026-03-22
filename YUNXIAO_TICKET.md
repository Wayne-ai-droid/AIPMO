# 云效API访问令牌问题 - 工单内容

## 问题标题
个人访问令牌调用API返回"不合法的access_token"

---

## 问题描述

使用云效个人访问令牌调用API时，返回"不合法的access_token"错误，无法获取项目数据。

---

## 环境信息

- **云效版本**：新版云效DevOps
- **访问方式**：个人访问令牌（Personal Access Token）
- **组织ID**：6925baaef9c52e7d8c27b51b
- **Token创建位置**：个人设置 → 个人访问令牌

---

## 已配置的权限

在个人访问令牌中已勾选以下权限：
- [x] 项目管理 - 读取
- [x] 工作项管理 - 读取
- [x] 迭代管理 - 读取
- [x] 成员管理 - 读取

---

## API调用方式

### 请求示例
```bash
curl -s "https://devops.aliyun.com/api/projects?organizationId=6925baaef9c52e7d8c27b51b" \
  -H "Authorization: Bearer at-xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json"
```

### 响应结果
```json
{
  "name": "InvalidAccessToken",
  "message": "不合法的access_token"
}
```

---

## 已尝试的解决方案

1. ✅ 重新创建Token（多次）
2. ✅ 确认Token未过期（有效期90天）
3. ✅ 确认已勾选所有必要权限
4. ✅ 尝试不同的API端点（/api/projects, /api/organization/info等）
5. ✅ 等待Token权限生效（超过10分钟）

---

## 期望结果

能够正常使用个人访问令牌调用云效API，获取项目列表、工作项等数据。

---

## 实际结果

所有API调用都返回"不合法的access_token"错误，无法获取任何数据。

---

## 可能的原因猜测

1. 个人访问令牌不支持某些API调用？
2. 需要使用企业应用AccessKey而不是个人Token？
3. API调用格式或Header有特殊要求？
4. Token权限配置不完整？

---

## 请求支持

请帮助确认：
1. 个人访问令牌是否支持调用这些API？
2. 正确的API调用方式是什么？
3. 是否需要使用其他认证方式（如企业应用AccessKey）？
4. 如果需要切换认证方式，如何平滑迁移？

---

## 联系方式

- 企业邮箱：waynelin@dowsure.com
- 使用场景：内部项目管理Dashboard开发

---

## 附件

- [ ] Token截图（已打码）
- [ ] 权限配置截图
- [ ] 错误响应截图

---

*提交时间：2026-03-20*
