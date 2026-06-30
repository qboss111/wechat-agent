const fs = require('fs');
const path = require('path');

/**
 * 文档解析：把上传的文件解析为纯文本
 * 目前支持 txt / md，后续可在此扩展 PDF / Word
 * @param {string} filePath 文件绝对路径
 * @returns {Promise<string>} 纯文本
 */
async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath);

  switch (ext) {
    case '.txt':
    case '.md':
      // 默认 utf8；含中文 BOM 时去 BOM
      return raw.toString('utf8').replace(/^\uFEFF/, '');
    // TODO: 扩展 PDF / Word 解析（如 pdf-parse / mammoth）
    default:
      // 未知类型按文本尽力解析
      return raw.toString('utf8');
  }
}

module.exports = { parseFile };
