const app = getApp();
const { request } = require('../../utils/request');

Page({
  data: {
    baseUrl: '',
    health: null,
  },

  onShow() {
    this.setData({ baseUrl: app.globalData.baseUrl });
    this.checkHealth();
  },

  onBaseUrlInput(e) {
    this.setData({ baseUrl: e.detail.value });
  },

  // 保存后端地址（仅存内存，不写本地缓存，避免污染合法域名配置）
  onSaveUrl() {
    const url = this.data.baseUrl.trim().replace(/\/+$/, '');
    app.globalData.baseUrl = url;
    wx.showToast({ title: '已保存(仅本次)', icon: 'success' });
    this.checkHealth();
  },

  // 测试连接
  async checkHealth() {
    try {
      const res = await request({ url: '/api/health', loading: false });
      this.setData({ health: res });
    } catch (e) {
      this.setData({ health: null });
    }
  },

  // 清空对话历史（本地提示，对话历史存在各页面内存中）
  onClearHistory() {
    wx.showModal({
      title: '提示',
      content: '将清除本地对话记录，确定吗？',
      success: (r) => {
        if (r.confirm) wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },

  // 清空知识库
  onClearKb() {
    wx.showModal({
      title: '危险操作',
      content: '将删除所有知识库文档及向量，确定吗？',
      confirmColor: '#f56c6c',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await request({ url: '/api/knowledge', method: 'DELETE' });
          wx.showToast({ title: '知识库已清空', icon: 'success' });
        } catch (e) {}
      },
    });
  },
});
