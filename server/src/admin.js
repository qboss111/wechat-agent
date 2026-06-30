// 后台管理网页：可视化配置智能体提示词
// 返回单文件 HTML，前端用原生 JS 调 /api/prompt 接口

function adminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>智能体后台配置</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #f0f2f5;
    color: #1a1a1a;
    line-height: 1.6;
    padding: 20px;
  }
  .container { max-width: 820px; margin: 0 auto; }
  .header {
    background: linear-gradient(135deg, #4a6cf7, #6a5acd);
    color: #fff;
    padding: 28px 32px;
    border-radius: 14px;
    margin-bottom: 24px;
    box-shadow: 0 4px 16px rgba(74,108,247,.2);
  }
  .header h1 { font-size: 24px; margin-bottom: 6px; }
  .header p { font-size: 14px; opacity: .9; }
  .card {
    background: #fff;
    border-radius: 14px;
    padding: 26px 30px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,.05);
  }
  .card-title {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-desc {
    font-size: 13px;
    color: #888;
    margin-bottom: 14px;
  }
  .field { margin-bottom: 20px; }
  .field:last-child { margin-bottom: 0; }
  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  label .hint { font-weight: 400; color: #aaa; font-size: 12px; margin-left: 6px; }
  textarea {
    width: 100%;
    min-height: 110px;
    padding: 12px 14px;
    border: 1.5px solid #e4e7ed;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: border-color .2s;
    line-height: 1.6;
  }
  textarea:focus { outline: none; border-color: #4a6cf7; }
  .examples { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .example-btn {
    font-size: 12px;
    color: #4a6cf7;
    background: #eef3ff;
    border: 1px solid #d8e3ff;
    padding: 5px 12px;
    border-radius: 14px;
    cursor: pointer;
    transition: all .15s;
  }
  .example-btn:hover { background: #4a6cf7; color: #fff; }
  .actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    align-items: center;
  }
  .btn {
    padding: 11px 28px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .btn-primary { background: #4a6cf7; color: #fff; }
  .btn-primary:hover { background: #3a5ce0; }
  .btn-ghost { background: #f0f2f5; color: #666; }
  .btn-ghost:hover { background: #e4e7ed; }
  .status { font-size: 13px; color: #888; }
  .status.success { color: #52c41a; }
  .status.error { color: #f5222d; }
  .updated { font-size: 12px; color: #bbb; margin-left: auto; }
  .toast {
    position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; padding: 12px 24px; border-radius: 8px;
    font-size: 14px; opacity: 0; transition: opacity .3s; pointer-events: none;
    z-index: 999;
  }
  .toast.show { opacity: 1; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🤖 智能体后台配置</h1>
    <p>在这里配置智能体的提示词（人设/语气/行为规则），保存后即时生效，无需重启服务</p>
  </div>

  <div class="card">
    <div class="card-title">⚡ 对话模型</div>
    <div class="card-desc">选择大模型。切换后即时生效。<b>glm-4-flash 最快（约1-2秒）</b>，glm-5 能力最强但较慢（约15-20秒）。</div>
    <div class="field">
      <label>模型 <span class="hint">（建议日常用 flash，复杂任务用 glm-5）</span></label>
      <select id="chatModel" style="width:100%;padding:11px 14px;border:1.5px solid #e4e7ed;border-radius:8px;font-size:14px;font-family:inherit;background:#fff">
        <option value="glm-4-flash">glm-4-flash（最快，免费，2秒内）</option>
        <option value="glm-4.6">glm-4.6（较强，中等速度）</option>
        <option value="glm-5">glm-5（最强，较慢，15-20秒）</option>
        <option value="glm-4">glm-4（标准版）</option>
      </select>
    </div>
  </div>

  <div class="card">
    <div class="card-title">💬 普通对话提示词</div>
    <div class="card-desc">定义智能体在普通对话中的人设、语气和行为。每次对话都会作为系统指令发给大模型。</div>
    <div class="field">
      <label>系统提示词 <span class="hint">（System Prompt）</span></label>
      <textarea id="systemPrompt" placeholder="例如：你是一位资深的编程导师，擅长用通俗易懂的方式讲解技术概念..."></textarea>
      <div class="examples">
        <span class="example-btn" onclick="fillExample('system', '客服')">客服助手</span>
        <span class="example-btn" onclick="fillExample('system', '编程')">编程导师</span>
        <span class="example-btn" onclick="fillExample('system', '写作')">写作助手</span>
        <span class="example-btn" onclick="fillExample('system', '翻译')">翻译专家</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📚 知识库问答提示词</div>
    <div class="card-desc">开启「知识库」开关时的专用提示词。引导模型基于你的文档回答，并说明如何处理文档中没有的信息。</div>
    <div class="field">
      <label>知识库提示词 <span class="hint">（RAG Prompt）</span></label>
      <textarea id="ragPrompt" placeholder="例如：你是一个专业的知识库问答助手。请严格根据提供的知识库内容回答..."></textarea>
    </div>
  </div>

  <div class="card">
    <div class="card-title">👋 开场白</div>
    <div class="card-desc">小程序对话页打开时显示的第一条欢迎消息。</div>
    <div class="field">
      <label>欢迎语 <span class="hint">（Welcome Message）</span></label>
      <textarea id="welcome" placeholder="例如：你好！我是智能助手，请问有什么可以帮你？" style="min-height:70px"></textarea>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-primary" onclick="save()">💾 保存并生效</button>
    <button class="btn btn-ghost" onclick="reset()">↺ 恢复默认</button>
    <span class="status" id="status"></span>
    <span class="updated" id="updated"></span>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
  const EXAMPLES = {
    system: {
      '客服': '你是"智谱科技"的友好客服助手。回答用户关于产品、订单、售后的问题时要耐心、亲切、专业。如果遇到无法解决的问题，请引导用户联系人工客服（电话 400-xxx）。回答简洁明了，避免啰嗦。',
      '编程': '你是一位资深的全栈编程导师，擅长用通俗易懂的语言讲解技术概念。回答时请：1) 先给出直接答案；2) 配合简洁的代码示例（用 Markdown 代码块）；3) 必要时补充关键原理。鼓励提问者动手实践。',
      '写作': '你是一位专业的中文写作助手，擅长润色文章、扩写缩写、改写风格。修改时会保持原意，并简要说明改动理由。可以根据用户要求切换正式/活泼/学术等语气。',
      '翻译': '你是一位精通中英互译的专业翻译。翻译时做到"信达雅"：准确传达原意、表达通顺自然、用词得体。遇到歧义或多义词，会给出备选译法并说明差异。'
    }
  };

  // 加载当前配置
  async function load() {
    try {
      const res = await fetch('/api/prompt');
      const data = await res.json();
      document.getElementById('chatModel').value = data.chatModel || 'glm-4-flash';
      document.getElementById('systemPrompt').value = data.systemPrompt || '';
      document.getElementById('ragPrompt').value = data.ragPrompt || '';
      document.getElementById('welcome').value = data.welcome || '';
      if (data.updatedAt) {
        const d = new Date(data.updatedAt);
        document.getElementById('updated').textContent = '上次更新：' + d.toLocaleString('zh-CN');
      }
    } catch (e) {
      showStatus('加载失败：' + e.message, 'error');
    }
  }

  // 保存
  async function save() {
    const body = {
      chatModel: document.getElementById('chatModel').value,
      systemPrompt: document.getElementById('systemPrompt').value,
      ragPrompt: document.getElementById('ragPrompt').value,
      welcome: document.getElementById('welcome').value,
    };
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✅ 保存成功，已即时生效！');
        showStatus('已保存', 'success');
        if (data.config && data.config.updatedAt) {
          document.getElementById('updated').textContent = '上次更新：' + new Date(data.config.updatedAt).toLocaleString('zh-CN');
        }
      } else {
        showStatus(data.error || '保存失败', 'error');
      }
    } catch (e) {
      showStatus('保存失败：' + e.message, 'error');
    }
  }

  // 恢复默认
  async function reset() {
    if (!confirm('确定恢复为默认配置？当前配置（含模型、提示词）将被覆盖。')) return;
    try {
      const res = await fetch('/api/prompt/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await load();
        showToast('已恢复默认');
      }
    } catch (e) {
      showStatus('重置失败：' + e.message, 'error');
    }
  }

  // 填充示例
  function fillExample(type, name) {
    const text = EXAMPLES[type][name];
    if (text) document.getElementById(type + 'Prompt').value = text;
  }

  function showStatus(msg, type) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status ' + (type || '');
  }
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show';
    setTimeout(() => { el.className = 'toast'; }, 2000);
  }

  load();
</script>
</body>
</html>`;
}

module.exports = { adminPage };
