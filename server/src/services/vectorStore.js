const fs = require('fs');
const config = require('../config');

// 纯 JavaScript 向量检索实现，无需 C++ 编译环境，开箱即用
// meta 结构：
//   chunks:  [{ id, docId, docName, text }]
//   vectors: number[][]                     // 与 chunks 一一对应
//   documents: { docId: { name, count, createdAt } }
let meta = { chunks: [], vectors: [], documents: {} };

/** 确保数据目录存在 */
function ensureDirs() {
  for (const dir of [config.dataDir, config.uploadsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

/** 初始化：从磁盘恢复（或创建空库） */
function initIndex() {
  ensureDirs();
  if (fs.existsSync(config.metaFile)) {
    meta = JSON.parse(fs.readFileSync(config.metaFile, 'utf8'));
    meta.chunks = meta.chunks || [];
    meta.vectors = meta.vectors || [];
    meta.documents = meta.documents || {};
  } else {
    meta = { chunks: [], vectors: [], documents: {} };
  }
}

/** 落盘 */
function persist() {
  fs.writeFileSync(config.metaFile, JSON.stringify(meta));
}

/** 当前知识块数量 */
function count() {
  return meta.chunks.length;
}

/**
 * 添加一批知识块
 * @param {string} docId 文档 id
 * @param {string} docName 文档名
 * @param {Array<{text:string}>} chunks 文本块
 * @param {number[][]} vectors 与 chunks 等长的向量数组
 */
function addChunks(docId, docName, chunks, vectors) {
  if (chunks.length !== vectors.length) {
    throw new Error('chunks 与 vectors 数量不一致');
  }
  for (let i = 0; i < chunks.length; i++) {
    meta.chunks.push({ docId, docName, text: chunks[i].text });
    meta.vectors.push(vectors[i]);
  }
  const prev = meta.documents[docId] || { name: docName, count: 0, createdAt: Date.now() };
  meta.documents[docId] = { ...prev, name: docName, count: prev.count + chunks.length };
  persist();
}

/** 计算两个向量的余弦相似度 */
function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * 根据查询向量检索最相似的知识块（暴力余弦检索）
 * 中小规模知识库（数千块内）性能完全够用
 * @param {number[]} queryVector
 * @param {number} k
 * @returns {Array<{text:string, docName:string, score:number}>}
 */
function search(queryVector, k) {
  if (meta.vectors.length === 0) return [];
  const scored = meta.vectors.map((v, i) => ({
    i,
    score: cosineSimilarity(queryVector, v),
  }));
  // 取相似度最高的 k 个
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(k, scored.length));
  return top.map((s) => ({
    text: meta.chunks[s.i].text,
    docName: meta.chunks[s.i].docName,
    score: s.score,
  }));
}

/** 删除整篇文档 */
function deleteDocument(docId) {
  if (!meta.documents[docId]) return false;
  delete meta.documents[docId];
  const keep = [];
  const keepVec = [];
  for (let i = 0; i < meta.chunks.length; i++) {
    if (meta.chunks[i].docId !== docId) {
      keep.push(meta.chunks[i]);
      keepVec.push(meta.vectors[i]);
    }
  }
  meta.chunks = keep;
  meta.vectors = keepVec;
  persist();
  return true;
}

/** 文档列表 */
function listDocuments() {
  return Object.entries(meta.documents).map(([id, v]) => ({
    id,
    name: v.name,
    chunkCount: v.count,
    createdAt: v.createdAt,
  }));
}

/** 完全清空知识库 */
function clear() {
  meta = { chunks: [], vectors: [], documents: {} };
  persist();
}

module.exports = {
  initIndex,
  addChunks,
  search,
  deleteDocument,
  listDocuments,
  count,
  clear,
};
