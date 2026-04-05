# 🔌 API 集成技术文档

## 1. 千问（Qianwen）API 集成

### 1.1 配置说明

项目使用阿里云千问 API 进行 AI 内容分析，支持 OpenAI 兼容格式调用。

**环境变量配置：**

```env
# AI Provider 配置
AI_PROVIDER=qwen
QIANWEN_API_KEY=your_qianwen_api_key
QIANWEN_MODEL=qwen3-max
QIANWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

### 1.2 API 调用示例

```typescript
const response = await fetch(QIANWEN_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${QIANWEN_API_KEY}`
  },
  body: JSON.stringify({
    model: QIANWEN_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.2,
    max_tokens: 500
  })
});

const json = await response.json();
const content = json.choices?.[0]?.message?.content;
```

### 1.3 响应格式

```json
{
  "id": "chatcmpl-xxxx",
  "model": "qwen3-max",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"isReal\": true, \"relevance\": 85, \"importance\": \"high\", ...}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

---

## 2. 网页搜索爬虫

### 2.1 Bing 搜索爬虫

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
];

async function searchBing(query: string): Promise<SearchResult[]> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const response = await axios.get('https://www.bing.com/search', {
    params: { q: query, count: 20 },
    headers: { 'User-Agent': userAgent }
  });

  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];

  $('li.b_algo').each((_, element) => {
    const title = $(element).find('h2 a').text();
    const url = $(element).find('h2 a').attr('href');
    const snippet = $(element).find('.b_caption p').text();

    if (title && url) {
      results.push({ title, url, snippet, source: 'bing' });
    }
  });

  return results;
}
```

### 2.2 频率控制

```typescript
class RateLimiter {
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(minIntervalMs: number = 5000) {
    this.minInterval = minIntervalMs;
  }

  async wait(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}
```

---

## 3. Prisma + SQLite 配置

### 3.1 Schema 定义

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Keyword {
  id        String    @id @default(uuid())
  text      String    @unique
  category  String?
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  hotspots  Hotspot[]
}

model Hotspot {
  id              String    @id @default(uuid())
  title           String
  content         String
  url             String
  source          String    // bing, hackernews, sogou, bilibili, weibo, weixin, rss
  sourceId        String?
  isReal          Boolean   @default(true)
  relevance       Int       @default(0)
  relevanceReason String?   // AI 分析相关性的理由
  keywordMentioned Boolean? // 内容中是否直接提及了关键词
  importance      String    @default("low")
  summary         String?
  viewCount       Int?
  likeCount       Int?
  retweetCount    Int?
  replyCount      Int?
  commentCount    Int?
  quoteCount      Int?
  danmakuCount    Int?
  authorName      String?
  authorUsername  String?
  authorAvatar    String?
  authorFollowers Int?
  authorVerified  Boolean?
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  keywordId       String?
  keyword         Keyword?  @relation(fields: [keywordId], references: [id], onDelete: SetNull)

  @@unique([url, source])
}

model Notification {
  id        String   @id @default(uuid())
  type      String
  title     String
  content   String
  isRead    Boolean  @default(false)
  hotspotId String?
  createdAt DateTime @default(now())
}

model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value String
}
```

### 3.2 迁移命令

```bash
# 初始化数据库
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 推送 schema 变更
npx prisma db push
```

### 3.3 环境变量

```env
DATABASE_URL="file:./dev.db"
```

---

## 4. Express + WebSocket 配置

### 4.1 服务器配置

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// WebSocket 连接
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (keywords: string[]) => {
    keywords.forEach(kw => socket.join(`keyword:${kw}`));
  });

  socket.on('unsubscribe', (keywords: string[]) => {
    keywords.forEach(kw => socket.leave(`keyword:${kw}`));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { app, httpServer, io };
```

### 4.2 路由结构

```typescript
// routes/keywords.ts
router.get('/', async (req, res) => {
  const keywords = await prisma.keyword.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { hotspots: true } } }
  });
  res.json(keywords);
});

router.post('/', async (req, res) => {
  const { text, category } = req.body;
  const keyword = await prisma.keyword.create({
    data: { text: text.trim(), category: category?.trim() || null }
  });
  res.status(201).json(keyword);
});

router.patch('/:id/toggle', async (req, res) => {
  const keyword = await prisma.keyword.findUnique({ where: { id: req.params.id } });
  const updated = await prisma.keyword.update({
    where: { id: req.params.id },
    data: { isActive: !keyword.isActive }
  });
  res.json(updated);
});
```

---

## 5. 定时任务配置

```typescript
import cron from 'node-cron';

// 每 30 分钟执行一次热点检查
cron.schedule('*/30 * * * *', async () => {
  console.log('Running scheduled hotspot check...');
  await runHotspotCheck(io);
});

// 手动触发
app.post('/api/check-hotspots', async (req, res) => {
  await runHotspotCheck(io);
  res.json({ message: 'Hotspot check completed' });
});
```

### 热点检查流程

1. 获取所有激活的关键词
2. 对每个关键词进行账号检测（Bilibili/微博）
3. 执行查询扩展（Query Expansion）
4. 并行从多个来源抓取数据
5. 去重 → 新鲜度过滤 → 来源优先级排序
6. AI 分析（相关性、重要性、真实性）
7. 保存热点并发送通知

---

## 6. 邮件通知配置

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendHotspotEmail(hotspot: Hotspot) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `🔥 新热点: ${hotspot.title}`,
    html: `
      <h2>${hotspot.title}</h2>
      <p>${hotspot.summary}</p>
      <p><strong>重要程度:</strong> ${hotspot.importance}</p>
      <p><strong>相关性:</strong> ${hotspot.relevance}%</p>
      <p><a href="${hotspot.url}">查看原文</a></p>
    `
  });
}
```
