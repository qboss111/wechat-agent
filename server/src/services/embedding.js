const OpenAI = require('openai');
const config = require('../config');

// 智谱向量化：使用普通按量计费端点 + 向量化专用 Key
const client = new OpenAI({
  apiKey: config.zhipu.embeddingApiKey,
  baseURL: config.zhipu.embeddingBaseURL,
});

/**
 * 调用智谱 embedding 进行文本向量化
 * @param {string|string[]} input - 单条文本或文本数组
 * @returns {Promise<number[] | number[][]>} 向量（单条）或向量数组（批量）
 */
async function embed(input) {
  if (!config.zhipu.embeddingApiKey) {
    throw new Error('未配置向量化 API Key，请在 server/.env 中设置 ZHIPU_EMBEDDING_API_KEY 或 ZHIPU_API_KEY');
  }
  const isBatch = Array.isArray(input);
  const res = await client.embeddings.create({
    model: config.zhipu.embeddingModel,
    input,
  });
  // 按 index 排序，保证批量时顺序与输入一致
  const sorted = res.data.slice().sort((a, b) => a.index - b.index).map((d) => d.embedding);
  // 自适应维度：首次调用按实际返回更新 config，保证向量库维度一致
  if (sorted[0] && config.embeddingDim !== sorted[0].length) {
    config.embeddingDim = sorted[0].length;
  }
  return isBatch ? sorted : sorted[0];
}

module.exports = { embed };
