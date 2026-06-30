App({
  // 全局后端地址：HTTPS 域名（已备案，可用于正式发布）
  globalData: {
    baseUrl: 'https://api.badfruite.cn',
  },

  onLaunch() {
    // 若设置页保存过地址，优先用保存的（开发调试时可临时改）
    const saved = wx.getStorageSync('baseUrl');
    if (saved) this.globalData.baseUrl = saved;
  },
});
