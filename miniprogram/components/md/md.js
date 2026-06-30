const { parseMarkdown } = require('../../utils/markdown');

Component({
  properties: {
    // markdown 原始文本
    content: { type: String, value: '' },
  },
  data: {
    blocks: [], // 解析后的块数组
  },
  observers: {
    content(val) {
      this.setData({ blocks: parseMarkdown(val) });
    },
  },
  lifetimes: {
    attached() {
      this.setData({ blocks: parseMarkdown(this.data.content) });
    },
  },
  methods: {
    // 复制代码块
    onCopyCode(e) {
      wx.setClipboardData({
        data: e.currentTarget.dataset.code || '',
        success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      });
    },
  },
});
