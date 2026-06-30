const fs = require('fs');
const path = require('path');

// 提示词配置存储：读写本地 JSON，修改后立即生效（无需重启）
const configFile = path.join(__dirname, '..', '..', 'data', 'prompt_config.json');

// 默认提示词配置
const DEFAULT = {
  // 对话模型（后台可切换，实时生效；留空则用 .env 里的 CHAT_MODEL）
  chatModel: 'glm-4-flash',
  // 普通对话系统提示词（智能体人设）
  systemPrompt:
    '你是一个友好、专业的智能助手。回答要清晰、简洁、有条理，' +
    '遇到不确定的问题要诚实说明。可以使用 Markdown 格式让回答更易读。',
  // 知识库问答专用提示词
  ragPrompt:
    '你是一个智能助手。请根据下方【知识库内容】回答用户的问题。' +
    '如果知识库中没有相关信息，请基于你的通用知识如实回答，并说明"知识库中未找到相关内容"。' +
    '回答要简洁准确，可使用 Markdown 格式。',
  // 开场白（可选，展示在对话页首条）
  welcome: '你好！我是智谱智能体，有什么可以帮你的？😊',
  updatedAt: null,
};

let cache = { ...DEFAULT };

/** 读取配置（启动时调用 + 每次读取都走文件，保证多来源修改一致） */
function load() {
  try {
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      cache = { ...DEFAULT, ...data };
    }
  } catch (e) {
    console.warn('[promptConfig] 读取失败，使用默认值:', e.message);
    cache = { ...DEFAULT };
  }
  return cache;
}

/** 保存配置并更新缓存 */
function save(data) {
  cache = {
    chatModel: data.chatModel ?? DEFAULT.chatModel,
    systemPrompt: data.systemPrompt ?? DEFAULT.systemPrompt,
    ragPrompt: data.ragPrompt ?? DEFAULT.ragPrompt,
    welcome: data.welcome ?? DEFAULT.welcome,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(configFile, JSON.stringify(cache, null, 2));
  return cache;
}

/** 获取当前配置（实时从文件读取，保证后台修改即时生效） */
function get() {
  return load();
}

module.exports = { get, save, load };
