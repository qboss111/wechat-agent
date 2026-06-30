const express = require('express');
const { chat, chatStream } = require('../services/glm');
const { ask, askStream } = require('../services/rag');
const promptConfig = require('../services/promptConfig');

const router = express.Router();

// 构造对话上下文消息（最多保留最近 10 轮，避免超 token）
// 系统提示词从后台配置读取（实时生效）
function buildMessages(message, history) {
  const recent = (history || []).slice(-10);
  const { systemPrompt } = promptConfig.get();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recent,
  ];
  messages.push({ role: 'user', content: message });
  return messages;
}

/**
 * POST /api/chat （非流式）
 * body: { message: string, history?: Array<{role,content}>, useKnowledge?: boolean }
 */
router.post('/', async (req, res) => {
  try {
    const { message, history = [], useKnowledge = false } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '参数 message 不能为空' });
    }

    if (useKnowledge) {
      const { answer, context } = await ask(message);
      return res.json({
        answer,
        useKnowledge: true,
        sources: context.map((c) => ({ docName: c.docName, score: c.score })),
      });
    }

    const messages = buildMessages(message, history);
    const answer = await chat(messages);
    res.json({ answer, useKnowledge: false, sources: [] });
  } catch (err) {
    console.error('[chat] 错误:', err.message);
    res.status(500).json({ error: '对话失败：' + err.message });
  }
});

/**
 * POST /api/chat/stream （流式，SSE）
 * 每行格式: data: {type, data}\n\n
 *   {type:'sources', data:[{docName,score}]}   仅 RAG 模式先推送
 *   {type:'delta', data:'文字片段'}            增量回答
 *   {type:'done'}                              结束
 *   {type:'error', data:'错误信息'}
 */
router.post('/stream', async (req, res) => {
  // SSE 头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 关闭代理缓冲，保证实时

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const { message, history = [], useKnowledge = false } = req.body;
    if (!message || typeof message !== 'string') {
      send({ type: 'error', data: '参数 message 不能为空' });
      return res.end();
    }

    let gen;
    if (useKnowledge) {
      gen = askStream(message); // 先推送 sources，再流式 delta
    } else {
      const messages = buildMessages(message, history);
      // 包装成统一的 {type, data} 生成器
      gen = (async function* () {
        for await (const delta of chatStream(messages)) {
          yield { type: 'delta', data: delta };
        }
      })();
    }

    for await (const item of gen) {
      send(item);
    }
    send({ type: 'done' });
  } catch (err) {
    console.error('[chat/stream] 错误:', err.message);
    send({ type: 'error', data: '对话失败：' + err.message });
  } finally {
    res.end();
  }
});

module.exports = router;
