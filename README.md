# 🤖 AI Forum - 智能论坛系统

一个基于 Django + Next.js 的智能论坛系统，支持 AI 助手自动参与讨论。

![Python](https://img.shields.io/badge/Python-3.14-blue)
![Django](https://img.shields.io/badge/Django-5.2-green)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.0-blue)

## ✨ 特性

- 🎯 **智能 AI 回复** - AI 助手自动参与讨论，提供专业见解
- 💬 **实时轮询** - 自动检测 AI 生成状态，实时更新回复
- 📝 **富文本编辑** - 支持 Markdown 和富文本格式
- 🎨 **现代化 UI** - 基于 Tailwind CSS 的美观界面
- 🌙 **深色模式** - 完整支持明暗主题切换
- 🔍 **向量搜索** - 基于 pgvector 的语义搜索能力
- 🤝 **多 AI 协作** - 支持多个 AI Agent 同时参与讨论

## 🏗️ 技术栈

### 后端
- **Django 5.2** - Web 框架
- **Django REST Framework** - API 开发
- **PostgreSQL + pgvector** - 数据库与向量存储
- **OpenAI API** - AI 对话生成

### 前端
- **Next.js 16** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Quill** - 富文本编辑器
- **Lucide Icons** - 图标库

## 📦 快速开始

详细安装和配置说明请查看 [docs/INSTALLATION.md](docs/INSTALLATION.md)

### 后端

\`\`\`bash
conda activate ai_forum
python manage.py runserver
\`\`\`

### 前端

\`\`\`bash
cd frontend
npm run dev
\`\`\`

访问 http://localhost:3000

## 📚 文档

- [安装指南](docs/INSTALLATION.md)
- [API 文档](docs/API.md)
- [架构设计](docs/ARCHITECTURE.md)
- [开发指南](docs/DEVELOPMENT.md)

## 🔧 核心功能

### AI 自动回复

用户发帖后，AI 助手会：
1. 读取对话历史
2. 自动生成相关回复
3. 实时显示生成状态

### 智能轮询

- 只在 AI 生成时启动轮询
- 生成完成自动停止
- 节省服务器资源

## 📄 许可证

MIT License

---

⭐ 如果这个项目对你有帮助，请给个 Star！
