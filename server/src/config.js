const path = require('path');

// 读取 .env，若不存在则使用系统环境变量（不影响启动）
require('dotenv').config();

const config = {
  // 智谱 API —— 对话与向量化分离配置
  zhipu: {
    // 对话（Coding Plan 套餐）
    chatApiKey: process.env.ZHIPU_API_KEY || '',
    chatBaseURL: process.env.CHAT_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
    chatModel: process.env.CHAT_MODEL || 'glm-5',

    // 向量化（普通按量计费；Key 可与对话相同，也可单独配置）
    embeddingApiKey: process.env.ZHIPU_EMBEDDING_API_KEY || process.env.ZHIPU_API_KEY || '',
    embeddingBaseURL: process.env.EMBEDDING_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    embeddingModel: process.env.EMBEDDING_MODEL || 'embedding-3',
  },

  // RAG 参数
  rag: {
    chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 500,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 80,
    topK: parseInt(process.env.RAG_TOP_K, 10) || 5,
  },

  // 数据目录（运行时自动生成）
  dataDir: path.join(__dirname, '..', 'data'),
  uploadsDir: path.join(__dirname, '..', 'data', 'uploads'),
  indexFile: path.join(__dirname, '..', 'data', 'kb_index.hnsw'),
  metaFile: path.join(__dirname, '..', 'data', 'kb_meta.json'),

  // 服务
  port: parseInt(process.env.PORT, 10) || 3000,
};

// 向量维度：embedding-3 默认 2048，embedding-2 为 1024
// 首次向量化时按实际返回维度自适应（见 embedding.js）
config.embeddingDim = config.zhipu.embeddingModel === 'embedding-2' ? 1024 : 2048;

module.exports = config;
