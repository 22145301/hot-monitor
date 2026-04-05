#!/usr/bin/env tsx
import { prisma } from '../src/db.js';
import { sendHotspotEmail } from '../src/services/email.js';

async function main() {
  console.log('Preparing to send test email...');

  // 尝试取最新一条 hotspot
  const hotspot = await prisma.hotspot.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { keyword: true }
  });

  const testHotspot = hotspot ?? {
    id: 'test-hotspot-000',
    title: '测试热点：这是测试邮件标题',
    content: '这是一条用于测试邮件发送的示例内容。',
    url: 'https://example.com/test',
    source: 'test',
    importance: 'high',
    relevance: 90,
    summary: '示例摘要：测试邮件发送。',
    createdAt: new Date(),
    keyword: { text: '测试关键词' }
  };

  const ok = await sendHotspotEmail(testHotspot as any);
  console.log('Email send result:', ok);
  process.exit(ok ? 0 : 1);
}

main().catch(err => {
  console.error('Test email script error:', err);
  process.exit(1);
});
