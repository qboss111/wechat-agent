const config = require('../config');
const { embed } = require('./embedding');
const { chat, chatStream } = require('./glm');
const vectorStore = require('./vectorStore');
const promptConfig = require('./promptConfig');

/**
 * 检索知识库相关片段（RAG 公共步骤）
 * @param {string} question 用户问题
 * @returns {Promise<{hits:Array, messages:Array}>} 命中片段 + 拼好的 messages
 */
async function retrieve(question) {
  // 1. 向量化问题
  const queryVec = await embed(question);
  // 2. 检索
  const hits = vectorStore.search(queryVec, config.rag.topK);
  const context = hits
    .map((h, i) => `【知识${i + 1}】(来源: ${h.docName})\n${h.text}`)
    .join('\n\n');
  // 3. 拼装 Prompt（系统提示词从后台配置读取，实时生效）
  const { ragPrompt } = promptConfig.get();
  const userPrompt = `【知识库内容】\n${context || '（空）'}\n\n【用户问题】\n${question}`;
  const messages = [
    { role: 'system', content: ragPrompt },
    { role: 'user', content: userPrompt },
  ];
  return { hits, messages };
}

/**
 * RAG 查询流程（非流式）
 */
async function ask(question) {
  const { hits, messages } = await retrieve(question);
  const answer = await chat(messages, { temperature: 0.3 });
  return { context: hits, answer };
}

/**
 * RAG 查询流程（流式）
 * @returns {AsyncGenerator<{type:string, data:any}>}
 *   先 yield {type:'sources', data:[...]}，再多次 yield {type:'delta', data:'文字'}
 */
async function* askStream(question) {
  const { hits, messages } = await retrieve(question);
  // 先推送知识来源
  yield {
    type: 'sources',
    data: hits.map((c) => ({ docName: c.docName, score: c.score })),
  };
  // 再流式推送回答
  for await (const delta of chatStream(messages, { temperature: 0.3 })) {
    yield { type: 'delta', data: delta };
  }
}

module.exports = { ask, askStream };
