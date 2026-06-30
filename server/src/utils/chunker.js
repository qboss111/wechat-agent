const config = require('../config');

/**
 * 把长文本按字符切块，带重叠
 * 中英文混合场景按字符数切分足够简单有效
 * @param {string} text 原始文本
 * @returns {string[]} 文本块数组
 */
function chunkText(text) {
  const { chunkSize, chunkOverlap } = config.rag;
  const clean = (text || '').replace(/\r\n/g, '\n').trim();
  if (clean.length <= chunkSize) return clean ? [clean] : [];

  const chunks = [];
  let start = 0;
  const step = chunkSize - chunkOverlap; // 步长 = 块大小 - 重叠
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start += step;
  }
  return chunks.filter(Boolean);
}

module.exports = { chunkText };
