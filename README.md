# AIPMO - AI Project Management Office

AI驱动的项目管理办公室，通过多Agent协作完成产品需求、设计、开发和测试。

## 🏗️ 项目结构

```
AIPMO/
├── 📁 .github/
│   ├── 📁 workflows/        # CI/CD配置
│   └── 📁 ISSUE_TEMPLATE/   # Issue模板
├── 📁 docs/
│   ├── 📁 prd/              # 产品需求文档 (PM Agent)
│   ├── 📁 architecture/     # 架构设计文档 (Arch Agent)
│   └── 📁 design/           # UI/UX设计文档 (Design Agent)
├── 📁 src/                  # 源代码 (Dev Agent)
├── 📁 tests/                # 测试用例 (QA Agent)
└── 📁 scripts/              # 工具脚本
```

## 🤖 Agent团队

| Agent | 职责 | Git配置 |
|-------|------|---------|
| 📋 PM Agent | 需求分析、项目管理 | pm@aipmo.ai |
| 🏗️ Arch Agent | 系统架构设计 | arch@aipmo.ai |
| 🎨 Design Agent | UI/UX设计 | design@aipmo.ai |
| 💻 Dev Agent | 代码开发 | dev@aipmo.ai |
| 🧪 QA Agent | 测试验证 | qa@aipmo.ai |

## 🔄 工作流程

1. **创建Issue**: 用户在GitHub创建需求/问题
2. **需求分析**: PM Agent分析并分配任务
3. **协作执行**: 各Agent在Issue中更新进度
4. **代码提交**: Agent提交代码到对应分支
5. **验收关闭**: PM Agent验证后关闭Issue

## 📝 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**: `feat` `fix` `docs` `design` `test` `refactor`

## 📄 文档

- [产品需求文档](./docs/prd/)
- [架构设计文档](./docs/architecture/)
- [设计文档](./docs/design/)
