# HotPulse - AI 热点监控工具

一款基于 AI 的热点监控系统，支持从多个信息源自动聚合、抓取和分析热点内容，通过 WebSocket 实时推送和邮件通知用户。

![HotPulse 界面预览](https://pic.yupi.icu/1/image-20260304102630302.png)

## 核心功能

- **关键词监控** - 添加、启停监控关键词，系统每 30 分钟自动抓取
- **多数据源聚合** - 整合 Twitter/X、Bing、HackerNews、搜狗、B 站等 8+ 信息源
- **AI 智能分析** - 利用大模型进行真假识别、相关性评分、内容摘要
- **热度计算** - 综合点赞、转发、评论等指标计算热度 (0-100)
- **实时推送** - WebSocket 实时推送新热点 + 邮件通知
- **多维度筛选** - 按来源、重要性、时间范围筛选，支持热度/相关性/时间排序

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite + Tailwind CSS 4 + Framer Motion |
| 后端 | Express 5 + TypeScript + Prisma (SQLite) |
| 实时通信 | Socket.io |
| AI | OpenRouter (支持 Claude、GPT-4、Gemini 等模型) |
| 爬虫 | Cheerio + Axios |

## 项目结构

```
hot-monitor/
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/       # UI 组件
│   │   │   └── ui/          # 特效组件 (Spotlight, Meteors, BackgroundBeams)
│   │   ├── services/        # API 和 WebSocket 服务
│   │   │   ├── api.ts       # REST API 客户端
│   │   │   └── socket.ts    # WebSocket 客户端
│   │   ├── utils/           # 工具函数
│   │   │   ├── sortHotspots.ts   # 热点排序
│   │   │   └── relativeTime.ts  # 相对时间格式化
│   │   └── App.tsx          # 主应用组件
│   └── package.json
│
├── server/                   # Express 后端
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型定义
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   │   ├── hotspots.ts     # 热点管理
│   │   │   ├── keywords.ts    # 关键词管理
│   │   │   ├── notifications.ts  # 通知
│   │   │   └── settings.ts    # 设置
│   │   ├── services/        # 业务逻辑
│   │   │   ├── search.ts       # 国际搜索引擎 (Bing, Google, HN)
│   │   │   ├── chinaSearch.ts  # 中国平台 (微博、搜狗、B站)
│   │   │   ├── twitter.ts      # Twitter 抓取
│   │   │   ├── ai.ts           # AI 分析服务
│   │   │   └── email.ts        # 邮件通知
│   │   ├── jobs/
│   │   │   └── hotspotChecker.ts  # 定时任务
│   │   └── index.ts         # 服务入口
│   └── package.json
│
├── skills/                   # Agent Skills 技能包
│   └── hot-monitor/
│       └── scripts/         # Python 脚本
│
└── docs/                     # 项目文档
    ├── LOCAL_SETUP.md       # 本地运行指南
    ├── REQUIREMENTS.md      # 需求文档
    └── API_INTEGRATION.md   # API 集成文档
```

## 快速启动

### 前置要求

- Node.js ≥ 18 (推荐 20 LTS)
- OpenRouter API Key ([获取地址](https://openrouter.ai/settings/keys))

### 1. 安装依赖

```bash
# 后端
cd server
npm install
npx prisma generate
npx prisma db push

# 前端
cd ../client
npm install
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`，填入你的 OpenRouter API Key：

```env
DATABASE_URL="file:./dev.db"
PORT=3001
CLIENT_URL=http://localhost:5173
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. 启动服务

```bash
# 终端 1：后端 (端口 3001)
cd server && npm run dev

# 终端 2：前端 (端口 5173)
cd client && npm run dev
```

访问 **http://localhost:5173**

## 数据模型

项目使用 Prisma + SQLite，主要模型：

- **Keyword** - 监控关键词（支持激活/暂停）
- **Hotspot** - 热点内容（含 AI 分析结果、作者信息、互动数据）
- **Notification** - 通知记录
- **Setting** - 系统设置

## API 路由

| 路由 | 方法 | 描述 |
|------|------|------|
| `/api/keywords` | GET, POST | 关键词管理 |
| `/api/hotspots` | GET, POST | 热点列表与搜索 |
| `/api/notifications` | GET | 通知记录 |
| `/api/settings` | GET, PUT | 系统设置 |
| `/api/health` | GET | 健康检查 |
| `/api/check-hotspots` | POST | 手动触发热点检查 |

## WebSocket 事件

| 事件 | 方向 | 描述 |
|------|------|------|
| `hotspot:new` | 服务端 → 客户端 | 新热点发现 |
| `notification` | 服务端 → 客户端 | 通知消息 |
| `subscribe` | 客户端 → 服务端 | 订阅关键词 |
| `unsubscribe` | 客户端 → 服务端 | 取消订阅 |

## 热点分析

AI 分析功能由 OpenRouter 提供支持，热点入库前会经过：

1. **真假识别** - 排除标题党、假新闻
2. **相关性评分** - 0-100 分评估与关键词的相关性
3. **重要性分级** - low / medium / high / urgent
4. **智能摘要** - 生成 50 字以内的内容摘要
5. **直接提及检测** - 判断内容是否直接提及关键词

## 定时任务

- **热点检查** - 每 30 分钟自动执行
- 可通过前端「立即扫描」按钮手动触发

## 中国平台支持

除了国际搜索引擎，项目还整合了中国平台：

- **搜狗搜索** - 中文搜索结果
- **微博热搜** - 微博实时热搜
- **B 站** - Bilibili 视频与弹幕数据

## 开发相关

```bash
# 运行测试
cd server && npm test

# 数据库可视化
cd server && npx prisma studio

# 构建生产版本
cd client && npm run build
```

## 许可证

ISC
