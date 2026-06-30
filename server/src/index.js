const express = require('express');
const cors = require('cors');
const config = require('./config');
const vectorStore = require('./services/vectorStore');
const promptConfig = require('./services/promptConfig');
const chatRouter = require('./routes/chat');
const knowledgeRouter = require('./routes/knowledge');
const promptRouter = require('./routes/prompt');
const { adminPage } = require('./admin');

// 启动时初始化向量库（恢复已有数据或创建空库）
vectorStore.initIndex();
// 加载提示词配置
promptConfig.load();

const app = express();

// 中间件
app.use(cors()); // 本地开发允许跨域；小程序也走 http
app.use(express.json({ limit: '5mb' }));

// 路由
app.use('/api/chat', chatRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/prompt', promptRouter);

// 后台管理网页
app.get('/admin', (req, res) => res.send(adminPage()));
app.get('/', (req, res) => res.redirect('/admin'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    chatModel: config.zhipu.chatModel,
    chatEndpoint: config.zhipu.chatBaseURL,
    embeddingModel: config.zhipu.embeddingModel,
    embeddingEndpoint: config.zhipu.embeddingBaseURL,
    knowledgeChunks: vectorStore.count(),
    chatKeyConfigured: Boolean(config.zhipu.chatApiKey),
    embeddingKeyConfigured: Boolean(config.zhipu.embeddingApiKey),
  });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('[全局错误]', err.message);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`\n✅ 智能体后端已启动: http://localhost:${config.port}`);
  console.log(`   ⚙️ 后台管理: http://localhost:${config.port}/admin`);
  console.log(`   对话  : ${config.zhipu.chatModel} @ ${config.zhipu.chatBaseURL}`);
  console.log(`        Key: ${config.zhipu.chatApiKey ? '✓ 已配置' : '✗ 未配置'}`);
  console.log(`   向量化: ${config.zhipu.embeddingModel} @ ${config.zhipu.embeddingBaseURL}`);
  console.log(`        Key: ${config.zhipu.embeddingApiKey ? '✓ 已配置' : '✗ 未配置'}`);
  console.log(`   知识库知识块: ${vectorStore.count()} 条\n`);
});
