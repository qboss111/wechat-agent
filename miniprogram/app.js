App({
  // 全局后端地址（会自动探测选用最快的可用地址）
  globalData: {
    baseUrl: 'http://localhost:3000', // 默认值，onLaunch 中会自动探测更新
  },

  onLaunch() {
    // 若设置页保存过地址，优先用保存的
    const saved = wx.getStorageSync('baseUrl');
    if (saved) {
      this.globalData.baseUrl = saved;
      return;
    }
    // 否则自动探测可用地址（localhost 优先，失败则用局域网 IP）
    this.detectBaseUrl();
  },

  // 自动探测最快的可用后端地址
  // 候选：localhost（模拟器/同机）、局域网 IP（真机）
  detectBaseUrl() {
    const candidates = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.10.67:3000'];
    let resolved = false;
    candidates.forEach((url) => {
      if (resolved) return;
      wx.request({
        url: url + '/api/health',
        method: 'GET',
        timeout: 3000,
        success: (res) => {
          if (!resolved && res.statusCode === 200) {
            resolved = true;
            this.globalData.baseUrl = url;
            console.log('[app] 选用后端地址:', url);
          }
        },
        fail: () => {
          console.log('[app] 地址不可用:', url);
        },
      });
    });
  },
});
