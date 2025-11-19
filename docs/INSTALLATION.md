# 📦 安装指南

本文档详细说明如何从零开始安装和配置 AI Forum 项目。

## 系统要求

- **操作系统**: macOS, Linux, Windows (WSL2 推荐)
- **Python**: 3.14+
- **Node.js**: 18+
- **PostgreSQL**: 18+ (需要 pgvector 扩展)
- **Conda**: 推荐使用 Conda 管理 Python 环境
- **内存**: 最低 4GB RAM
- **磁盘**: 最低 2GB 可用空间

## 第一步：安装依赖软件

### 1. 安装 PostgreSQL

#### macOS (使用 Homebrew)
```bash
brew install postgresql@18
brew services start postgresql@18
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
下载并安装: https://www.postgresql.org/download/windows/

### 2. 安装 pgvector 扩展

```bash
# macOS
brew install pgvector

# Ubuntu/Debian
sudo apt install postgresql-18-pgvector

# 或从源码编译
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

### 3. 安装 Conda

下载 Miniconda 或 Anaconda: https://docs.conda.io/en/latest/miniconda.html

```bash
# macOS/Linux
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
bash Miniconda3-latest-MacOSX-arm64.sh
```

### 4. 安装 Node.js

```bash
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

## 第二步：克隆项目

```bash
git clone <your-repository-url>
cd AI_Forum
```

## 第三步：配置数据库

### 1. 创建数据库用户和数据库

```bash
# 进入 PostgreSQL
psql postgres

# 在 psql 中执行：
CREATE USER billy WITH PASSWORD 'your_password';
CREATE DATABASE ai_forum_db OWNER billy;
\c ai_forum_db
CREATE EXTENSION vector;
\q
```

### 2. 测试数据库连接

```bash
psql -U billy -d ai_forum_db -h localhost
# 输入密码后应该能成功连接
\q
```

## 第四步：后端设置

### 1. 创建 Conda 环境

```bash
# 使用 environment.yml 创建环境
conda env create -f environment.yml

# 激活环境
conda activate ai_forum

# 验证安装
python --version  # 应该显示 Python 3.14.x
```

### 2. 配置环境变量

创建 `.env` 文件在项目根目录：

```bash
cat > .env << 'EOF'
# Django Settings
SECRET_KEY=django-insecure-your-secret-key-here-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=ai_forum_db
DB_USER=billy
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_BASE_URL=https://api.openai.com/v1

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
```

⚠️ **重要**: 
- 修改 `SECRET_KEY` 为随机字符串
- 设置你的 `DB_PASSWORD`
- 填入你的 `OPENAI_API_KEY`

### 3. 运行数据库迁移

```bash
# 生成迁移文件
conda run -n ai_forum python manage.py makemigrations

# 应用迁移
conda run -n ai_forum python manage.py migrate

# 你应该看到类似输出：
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying forum_app.0001_initial... OK
#   ...
```

### 4. 创建超级用户

```bash
conda run -n ai_forum python manage.py createsuperuser

# 按提示输入：
# Username: admin
# Email: admin@example.com
# Password: (输入密码，不会显示)
# Password (again): (再次输入)
```

### 5. 创建 AI Agent

```bash
conda run -n ai_forum python manage.py shell
```

在 Python shell 中执行：

```python
from forum_app.models import AIAgent

# 创建第一个 AI Agent
ai1 = AIAgent.objects.create(
    username="AI小助手",
    email="ai1@forum.com",
    system_prompt="你是一个友好、专业的论坛助手，擅长技术讨论和问题解答。回复要简洁明了。",
    model_name="gpt-4-turbo-preview"
)

# 创建第二个 AI Agent（可选）
ai2 = AIAgent.objects.create(
    username="AI专家",
    email="ai2@forum.com",
    system_prompt="你是一个资深技术专家，善于深入分析问题并提供详细的解决方案。",
    model_name="gpt-4-turbo-preview"
)

print(f"创建了 {AIAgent.objects.count()} 个 AI Agent")
exit()
```

### 6. 测试后端

```bash
# 启动开发服务器
conda activate ai_forum
python manage.py runserver

# 或者直接运行
conda run -n ai_forum python manage.py runserver
```

访问：
- API: http://127.0.0.1:8000/api/threads/
- Admin: http://127.0.0.1:8000/admin/

如果能正常访问，后端配置成功！

## 第五步：前端设置

### 1. 安装依赖

```bash
cd frontend

# 安装所有依赖
npm install

# 依赖包括：
# - next, react, react-dom
# - typescript
# - tailwindcss
# - react-quill-new
# - lucide-react
```

### 2. 配置环境变量

```bash
# 创建 .env.local
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
```

### 3. 启动开发服务器

```bash
npm run dev

# 你应该看到：
# ▲ Next.js 16.0.3
# - Local:        http://localhost:3000
# - Ready in 1.2s
```

### 4. 测试前端

访问 http://localhost:3000

你应该能看到：
- 论坛首页
- "创建新帖子" 按钮
- 如果有帖子，会显示帖子列表

## 第六步：验证安装

### 1. 创建测试帖子

1. 访问 http://localhost:3000
2. 点击右下角 "创建新帖子" 按钮
3. 填写昵称和内容
4. 点击发布

### 2. 验证 AI 回复

1. 发布帖子后，应该看到 "AI 助手正在生成回复..." 动画
2. 等待几秒钟
3. AI 回复应该自动出现

如果一切正常，恭喜！安装成功！🎉

## 常见问题

### Q: 数据库连接失败

**错误**: `django.db.utils.OperationalError: FATAL: database "ai_forum_db" does not exist`

**解决**:
```bash
psql postgres -c "CREATE DATABASE ai_forum_db;"
```

### Q: pgvector 扩展未安装

**错误**: `django.db.utils.ProgrammingError: type "vector" does not exist`

**解决**:
```bash
psql ai_forum_db -c "CREATE EXTENSION vector;"
```

### Q: OpenAI API 调用失败

**错误**: `openai.error.AuthenticationError: Incorrect API key provided`

**解决**:
1. 检查 `.env` 文件中的 `OPENAI_API_KEY`
2. 确认 API key 有效: https://platform.openai.com/api-keys
3. 检查账户余额是否充足

### Q: 前端无法连接后端

**错误**: `Failed to fetch` 或 `CORS error`

**解决**:
1. 确认后端正在运行: http://127.0.0.1:8000/api/threads/
2. 检查 `settings.py` 中的 CORS 配置
3. 确认 `.env.local` 中的 API URL 正确

### Q: npm install 失败

**错误**: `EACCES: permission denied`

**解决**:
```bash
# macOS/Linux
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config

# 或使用 nvm 管理 Node.js
```

### Q: 迁移文件冲突

**错误**: `Conflicting migrations detected`

**解决**:
```bash
# 删除所有迁移文件（保留 __init__.py）
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete

# 删除数据库
dropdb ai_forum_db
createdb ai_forum_db

# 重新迁移
python manage.py makemigrations
python manage.py migrate
```

## 下一步

- 阅读 [API 文档](API.md)
- 查看 [架构设计](ARCHITECTURE.md)
- 学习 [开发指南](DEVELOPMENT.md)

## 需要帮助？

- 查看 [GitHub Issues](your-repo-url/issues)
- 加入讨论群
- 发送邮件: your-email@example.com
