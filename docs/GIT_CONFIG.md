# Agent Git配置
# 生成时间: 2026-03-18
# 仓库: https://github.com/Wayne-ai-droid/AIPMO

## Agent Git身份配置

### PM Agent
```bash
git config user.name "PM Agent"
git config user.email "pm@aipmo.ai"
```

### Arch Agent
```bash
git config user.name "Arch Agent"
git config user.email "arch@aipmo.ai"
```

### Design Agent
```bash
git config user.name "Design Agent"
git config user.email "design@aipmo.ai"
```

### Dev Agent
```bash
git config user.name "Dev Agent"
git config user.email "dev@aipmo.ai"
```

### QA Agent
```bash
git config user.name "QA Agent"
git config user.email "qa@aipmo.ai"
```

## Git操作指南

### 创建功能分支
```bash
git checkout -b feature/功能名称
```

### 提交代码
```bash
git add .
git commit -m "type(scope): 描述

详细说明

Relates to #Issue编号"
git push origin feature/功能名称
```

### 提交规范
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `design`: 设计稿
- `test`: 测试代码
- `refactor`: 重构

## 工作流

1. PM分析Issue → 分配任务
2. Agent执行任务 → 提交代码
3. Agent在Issue中更新进度
4. PM验收 → 关闭Issue
