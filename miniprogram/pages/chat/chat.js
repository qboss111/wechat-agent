const app = getApp();

Page({
  data: {
    messages: [], // {role:'user'|'assistant', content, sources?, pending?}
    input: '',
    useKnowledge: false, // 知识库开关
    sending: false,
    scrollToView: '',
  },

  onLoad() {
    // 先显示默认开场白，再异步从后台拉取（让后台配置的欢迎语生效）
    this.setData({
      messages: [
        {
          role: 'assistant',
          content: '你好！我是智谱智能体，有什么可以帮你的？😊',
        },
      ],
    });
    this.loadWelcome();
  },

  // 从后台读取开场白（实时生效）
  loadWelcome() {
    wx.request({
      url: app.globalData.baseUrl + '/api/prompt',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.welcome) {
          const list = this.data.messages.slice();
          if (list.length > 0 && list[0].role === 'assistant' && !list[0]._user) {
            list[0] = { role: 'assistant', content: res.data.welcome };
            this.setData({ messages: list });
          }
        }
      },
    });
  },

  // 输入框
  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  // 知识库开关
  onToggleKnowledge(e) {
    this.setData({ useKnowledge: e.detail.value });
  },

  // 发送（非流式，兼容性最佳；后端响应已很快）
  onSend() {
    const text = this.data.input.trim();
    if (!text || this.data.sending) return;

    const userMsg = { role: 'user', content: text };
    const pendingMsg = { role: 'assistant', content: '', pending: true, sources: [] };
    const history = this.data.messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role, content: m.content }));

    this.setData({
      messages: [...this.data.messages, userMsg, pendingMsg],
      input: '',
      sending: true,
    });
    this._scrollToBottom();

    // 非流式请求：稳定可靠，所有环境都支持
    wx.request({
      url: app.globalData.baseUrl + '/api/chat',
      method: 'POST',
      data: { message: text, history, useKnowledge: this.data.useKnowledge },
      header: { 'content-type': 'application/json' },
      timeout: 60000, // 60秒超时
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this._updateLastMsg(() => ({
            role: 'assistant',
            content: res.data.answer || '',
            sources: res.data.sources || [],
            pending: false,
          }));
        } else {
          const msg = (res.data && res.data.error) || '请求失败(' + res.statusCode + ')';
          this._updateLastMsg(() => ({
            role: 'assistant',
            content: '⚠️ ' + msg,
            pending: false,
          }));
        }
      },
      fail: (err) => {
        this._updateLastMsg(() => ({
          role: 'assistant',
          content: '⚠️ 网络错误：' + (err.errMsg || '请检查后端是否启动'),
          pending: false,
        }));
      },
      complete: () => {
        this.setData({ sending: false });
        this._scrollToBottom();
      },
    });
  },

  // 更新最后一条消息
  _updateLastMsg(fn) {
    const list = this.data.messages.slice();
    const last = list[list.length - 1];
    if (last) list[list.length - 1] = fn(last);
    this.setData({ messages: list });
  },

  // 清空对话
  onClear() {
    wx.showModal({
      title: '提示',
      content: '确定清空当前对话？',
      success: (r) => {
        if (r.confirm) {
          this.setData({
            messages: [{ role: 'assistant', content: '对话已清空，开始新的对话吧！' }],
          });
        }
      },
    });
  },

  _scrollToBottom() {
    const len = this.data.messages.length;
    this.setData({ scrollToView: 'msg-' + (len - 1) });
  },
});
