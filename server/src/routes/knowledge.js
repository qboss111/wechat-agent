const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { parseFile } = require('../utils/parser');
const { chunkText } = require('../utils/chunker');
const { embed } = require('../services/embedding');
const vectorStore = require('../services/vectorStore');

const router = express.Router();

// 上传配置：存到 uploads 目目录，文件名加时间戳防冲突
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = ['.txt', '.md'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('暂仅支持 .txt / .md 文件'), ok);
  },
});

// 文档列表
router.get('/list', (req, res) => {
  res.json({ documents: vectorStore.listDocuments() });
});

// 上传文档：解析 → 分块 → 向量化 → 入库
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未收到文件' });
    const docId = uuidv4();
    const docName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 1. 解析
    const text = await parseFile(req.file.path);
    if (!text.trim()) return res.status(400).json({ error: '文档内容为空' });

    // 2. 分块
    const pieces = chunkText(text);
    if (pieces.length === 0) return res.status(400).json({ error: '分块后无有效内容' });

    // 3. 批量向量化（embedding-3 限制单次 64 条，分批处理）
    const vectors = [];
    const BATCH = 64;
    for (let i = 0; i < pieces.length; i += BATCH) {
      const batch = pieces.slice(i, i + BATCH);
      const vecs = await embed(batch);
      vectors.push(...vecs);
    }

    // 4. 入库
    const chunks = pieces.map((t) => ({ text: t }));
    vectorStore.addChunks(docId, docName, chunks, vectors);

    res.json({
      message: '上传成功',
      document: { id: docId, name: docName, chunkCount: chunks.length },
    });
  } catch (err) {
    console.error('[upload] 错误:', err.message);
    res.status(500).json({ error: '上传失败：' + err.message });
  }
});

// 删除文档
router.delete('/:id', (req, res) => {
  const ok = vectorStore.deleteDocument(req.params.id);
  if (!ok) return res.status(404).json({ error: '文档不存在' });
  res.json({ message: '已删除' });
});

// 清空知识库
router.delete('/', (req, res) => {
  vectorStore.clear();
  res.json({ message: '已清空' });
});

module.exports = router;
