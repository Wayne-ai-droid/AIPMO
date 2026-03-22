# 云效 API 集成指南

## Token 信息

- **类型**: 个人访问令牌
- **名称**: AIPMO-Dashboard
- **创建时间**: 2026-03-19
- **过期时间**: 2026-06-17
- **状态**: ✅ 有效

## API 调用方式

云效 API 需要在请求中包含组织信息，调用格式如下：

### 基础 URL
```
https://devops.aliyun.com/api/organizations/{organizationId}/
```

### 认证 Header
```
Authorization: Bearer {your-token}
Content-Type: application/json
```

### 常用 API

#### 1. 获取组织信息
```http
GET https://devops.aliyun.com/api/organization/info
Authorization: Bearer pt-fp0mbOxHhsplobOXhLDeiWW1_6155f38a-7ea6-47b6-9274-56447618cae1
```

#### 2. 获取项目列表
```http
GET https://devops.aliyun.com/api/projects
Authorization: Bearer {token}
```

#### 3. 获取工作项（需求/缺陷）
```http
GET https://devops.aliyun.com/api/workitems?spaceType=Project&spaceIdentifier={projectId}
Authorization: Bearer {token}
```

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| spaceType | 空间类型 | Project（项目）|
| spaceIdentifier | 空间标识 | 项目ID |
| workitemType | 工作项类型 | Requirement（需求）、Bug（缺陷）|

## 使用示例

```javascript
// 获取项目列表
const response = await fetch('https://devops.aliyun.com/api/projects', {
  headers: {
    'Authorization': 'Bearer pt-fp0mbOxHhsplobOXhLDeiWW1_6155f38a-7ea6-47b6-9274-56447618cae1',
    'Content-Type': 'application/json'
  }
});

const projects = await response.json();
```

## 注意事项

1. **Token 有效期**: 2026-06-17 过期，需提前续期
2. **权限范围**: 个人令牌只能访问有权限的项目
3. **频率限制**: 默认 1000 次/分钟
4. **安全存储**: Token 应存储在环境变量中，不要提交到代码仓库

## 下一步

等待用户确认组织ID后，即可开始数据同步开发。
