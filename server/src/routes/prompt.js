const express = require('express');
const promptConfig = require('../services/promptConfig');

const router = express.Router();

// 获取当前提示词配置
router.get('/', (req, res) => {
  res.json(promptConfig.get());
});

// 保存提示词配置（实时生效，无需重启）
router.post('/', (req, res) => {
  try {
    const { chatModel, systemPrompt, ragPrompt, welcome } = req.body;
    const saved = promptConfig.save({ chatModel, systemPrompt, ragPrompt, welcome });
    res.json({ message: '保存成功，已即时生效', config: saved });
  } catch (err) {
    res.status(500).json({ error: '保存失败：' + err.message });
  }
});

// 重置为默认配置
router.post('/reset', (req, res) => {
  const saved = promptConfig.save({
    systemPrompt: null,
    ragPrompt: null,
    welcome: null,
  });
  res.json({ message: '已重置为默认', config: saved });
});

module.exports = router;
