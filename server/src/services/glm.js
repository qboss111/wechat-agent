const OpenAI = require('openai');
const config = require('../config');
const promptConfig = require('./promptConfig');

// 智谱 GLM 对话：使用 Coding Plan 端点 + 对话专用 Key
const client = new OpenAI({
  apiKey: config.zhipu.chatApiKey,
  baseURL: config.zhipu.chatBaseURL,
});

// 获取当前对话模型（后台可切换，实时生效；后台为空则用 .env 默认）
function getModel() {
  const { chatModel } = promptConfig.get();
  return chatModel || config.zhipu.chatModel;
}

/**
 * 调用智谱 GLM 进行对话（非流式）
 * @param {Array} messages - OpenAI 风格的消息数组 [{role, content}]
 * @param {Object} [options] - 可选：temperature 等
 * @returns {Promise<string>} 模型回复文本
 */
async function chat(messages, options = {}) {
  if (!config.zhipu.chatApiKey) {
    throw new Error('未配置对话 API Key，请在 server/.env 中设置 ZHIPU_API_KEY');
  }
  const completion = await client.chat.completions.create({
    model: options.model || getModel(),
    messages,
    temperature: options.temperature ?? 0.7,
  });
  return completion.choices?.[0]?.message?.content || '';
}

/**
 * 调用智谱 GLM 进行流式对话（逐字返回）
 * @param {Array} messages - OpenAI 风格的消息数组
 * @param {Object} [options] - 可选：temperature 等
 * @returns {AsyncGenerator<string>} 每次 yield 一段增量文本
 */
async function* chatStream(messages, options = {}) {
  if (!config.zhipu.chatApiKey) {
    throw new Error('未配置对话 API Key，请在 server/.env 中设置 ZHIPU_API_KEY');
  }
  const stream = await client.chat.completions.create({
    model: options.model || getModel(),
    messages,
    temperature: options.temperature ?? 0.7,
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) yield delta;
  }
}

module.exports = { chat, chatStream, getModel };
