# 🚀 保姆级本地运行指南

本文档手把手教你在本地跑起来 AI 热点监控工具的完整前后端，**零基础也能跟着做**。

## 📦 前置要求

| 工具 | 版本要求 | 检查命令 | 安装方式 |
|------|----------|----------|----------|
| Node.js | ≥ 18 | `node -v` | [官网下载](https://nodejs.org/en) |
| npm | ≥ 9 | `npm -v` | 随 Node.js 一起安装 |
| Git | 任意 | `git --version` | [官网下载](https://git-scm.com/) |

> 💡 推荐使用 Node.js 20 LTS 版本，稳定性最好。

## 第一步：克隆项目

```bash
git clone https://github.com/liyupi/yupi-hot-monitor.git
cd yupi-hot-monitor
```

> 如果 GitHub 访问较慢，可以在 Gitee 上导入仓库后克隆。

## 第二步：获取 API Key

项目需要 **1 个必需的 API Key**（千问），另外邮件通知为可选。

### ✅ 必需：千问（Qianwen）API Key

项目使用阿里云千问 API 进行 AI 内容分析。

1. 打开 [https://dashscope.console.aliyun.com/](https://dashscope.console.aliyun.com/)，注册并登录
2. 进入 API Keys 页面
3. 点击创建 API Key，复制生成的 Key
4. 确保账户有一定额度

> 💡 新用户有免费额度，足够日常使用。如果额度用完，可以在充值页面充值少量金额。

### 🔧 可选：邮件通知

配置后系统会在发现高重要性热点时自动发送邮件提醒，不配置则只有浏览器实时推送。

需要准备 SMTP 邮箱信息（以 163 邮箱为例）：
- SMTP 地址：`smtp.163.com`
- 端口：`465`（使用 SSL）
- 账号：你的 163 邮箱
- 密码：163 邮箱的 **授权码**（不是登录密码，在邮箱设置 → POP3/SMTP/IMAP → 客户端授权密码）

## 第三步：配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env
```

用任意文本编辑器打开 `server/.env` 文件，填入你的 API Key：

```env
# 数据库（无需修改）
DATABASE_URL="file:./dev.db"

# 服务器配置（无需修改）
PORT=3001
CLIENT_URL=http://localhost:5173

# ✅ 必填：千问 AI
AI_PROVIDER=qwen
QIANWEN_API_KEY=your_qianwen_api_key_here
QIANWEN_MODEL=qwen3-max
QIANWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

# 🔧 选填：邮件通知（不填则不发送邮件，不影响使用）
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@163.com
SMTP_PASS=your授权码
NOTIFY_EMAIL=接收通知的邮箱@example.com
```

> ⚠️ **注意**：`.env` 文件包含敏感信息，已被 `.gitignore` 排除，不会提交到代码仓库。

## 第四步：安装依赖

打开终端，分别安装前后端依赖：

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

> 💡 如果 npm install 速度慢，可以先切换为国内镜像：
> ```bash
> npm config set registry https://registry.npmmirror.com
> ```

## 第五步：初始化数据库

```bash
cd server
npx prisma generate
npx prisma db push
```

执行成功后，你会看到类似输出：

```
✔ Generated Prisma Client
🚀 Your database is now in sync with your Prisma schema.
```

> 💡 项目使用 SQLite 数据库，不需要额外安装数据库软件，Prisma 会自动在 `server/prisma/` 目录下创建 `dev.db` 文件。

## 第六步：启动项目

需要同时启动后端和前端，**打开两个终端窗口**：

**终端 1 — 启动后端：**

```bash
cd server
npm run dev
```

看到以下输出表示后端启动成功：

```
🔥 热点监控服务启动成功!
📡 Server running on http://localhost:3001
🔌 WebSocket ready
⏰ Hotspot check scheduled every 30 minutes
```

**终端 2 — 启动前端：**

```bash
cd client
npm run dev
```

看到以下输出表示前端启动成功：

```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

## 第七步：访问项目

打开浏览器，访问 **http://localhost:5173** ，你将看到 AI 热点监控工具的界面。

### 快速体验流程

1. 在页面的关键词输入框中输入一个关键词，比如 `GPT-5`，点击添加
2. 系统会自动开始从多个信息源抓取相关内容（也可以点击手动触发搜索）
3. 等待几秒到几十秒，热点信息流中会出现 AI 分析后的热点结果
4. 你可以使用筛选栏按来源、重要性、时间范围过滤结果
5. 也可以切换排序方式（热度、相关性、时间）

### 热点评估说明

每条热点会有以下 AI 分析指标：

| 指标 | 说明 |
|------|------|
| **相关性** | 0-100 分，评估内容与关键词的相关程度 |
| **重要性** | low/medium/high/urgent，评估热点的重要程度 |
| **真实性** | 判断是否为真实新闻（排除标题党、假新闻） |
| **直接提及** | 判断内容是否直接提及了关键词 |

## ❓ 常见问题

### Q1：后端启动时报错 `Cannot find module 'xxx'`

**原因**：依赖没有安装完整。

**解决**：重新安装依赖：
```bash
cd server
rm -rf node_modules
npm install
npx prisma generate
```

### Q2：前端页面打开后显示空白 / 接口报错

**原因**：前端代理和后端端口不一致。

**解决**：确认 `server/.env` 中的 `PORT` 和 `client/vite.config.ts` 中 proxy 的 target 端口一致（默认都是 `3001`）。

### Q3：热点搜索没有结果

**可能原因**：
1. 千问 API Key 未填写或额度不足 → 检查 `.env` 中的 `QIANWEN_API_KEY`
2. 关键词太冷门 → 尝试更热门的关键词，如 "AI"、"ChatGPT"
3. 网络问题导致搜索引擎爬虫失败 → 检查终端日志中是否有报错信息

### Q4：`npx prisma db push` 报错

**原因**：Prisma 版本或 Node.js 版本不兼容。

**解决**：
```bash
# 确认 Node.js 版本 ≥ 18
node -v

# 重新生成 Prisma Client
npx prisma generate
npx prisma db push
```

### Q5：Windows 系统运行终端命令报错

**解决**：建议在 VSCode 中把默认终端改为 Git Bash，或使用 PowerShell。避免使用 CMD，因为部分命令在 CMD 中不兼容。

### Q6：如何查看数据库中的数据？

```bash
cd server
npx prisma studio
```

浏览器会自动打开 Prisma Studio（默认 http://localhost:5555），可以可视化查看和编辑数据库内容。

## 🛑 停止项目

在各终端窗口按 `Ctrl + C` 即可停止前后端服务。

数据库文件（`server/prisma/dev.db`）会保留，下次启动时数据不会丢失。

## 📌 端口汇总

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| 后端 API | 3001 | Express + Socket.io |
| 前端页面 | 5173 | Vite 开发服务器 |
| Prisma Studio | 5555 | 数据库可视化（可选） |
