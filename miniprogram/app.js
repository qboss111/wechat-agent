App({
  // 全局后端地址：HTTPS 域名（已备案，已配置合法域名，固定使用）
  globalData: {
    baseUrl: 'https://api.badfruite.cn',
  },

  onLaunch() {
    // 固定使用合法域名，不再读取本地缓存（避免旧地址覆盖导致 not in domain list）
  },
});
