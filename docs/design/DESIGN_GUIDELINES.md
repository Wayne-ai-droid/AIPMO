# AIPMO 设计规范

**版本**: v1.0  
**日期**: 2026-03-18  
**设计**: Design Agent

---

## 1. 设计原则

### 1.1 简洁至上
- 减少视觉噪音
- 聚焦核心功能
- 保持一致性

### 1.2 协作优先
- 清晰的任务状态展示
- 实时进度更新
- 透明的责任归属

## 2. 色彩系统

```css
:root {
  /* 主色 */
  --primary: #1890ff;
  --primary-light: #40a9ff;
  --primary-dark: #096dd9;
  
  /* 状态色 */
  --success: #52c41a;  /* 完成 */
  --warning: #faad14;  /* 进行中 */
  --error: #f5222d;    /* 错误/阻塞 */
  --info: #1890ff;     /* 信息 */
  
  /* 中性色 */
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-muted: #8c8c8c;
  --border: #d9d9d9;
  --background: #f5f5f5;
}
```

## 3. Agent标识

| Agent | 图标 | 主色 |
|-------|------|------|
| PM | 📋 | 蓝色 #1890ff |
| Arch | 🏗️ | 紫色 #722ed1 |
| Design | 🎨 | 粉色 #eb2f96 |
| Dev | 💻 | 绿色 #52c41a |
| QA | 🧪 | 橙色 #fa8c16 |

## 4. Issue状态标签

```
🟡 待分析    → 需求刚创建
🔵 分析中    → PM Agent处理中
🟠 设计中    → Arch/Design Agent处理中
🔵 开发中    → Dev Agent处理中
🟣 测试中    → QA Agent处理中
🟢 已完成    → 任务完成
⚪ 已关闭    → Issue关闭
```

## 5. 文档模板

### 5.1 PRD模板
```markdown
# PRD - [功能名称]

## 背景
## 目标
## 功能需求
## 验收标准
## 时间计划
```

### 5.2 设计文档模板
```markdown
# 设计文档 - [功能名称]

## 概述
## 用户流程
## 界面设计
## 交互说明
## 设计稿链接
```

---

**提交**: Design Agent  
**分支**: feature/test-design  
**关联Issue**: #1
