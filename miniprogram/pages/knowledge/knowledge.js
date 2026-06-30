const { request } = require('../../utils/request');

Page({
  data: {
    documents: [],
    loading: false,
  },

  onShow() {
    this.loadList();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await request({ url: '/api/knowledge/list', loading: false });
      this.setData({ documents: res.documents || [] });
    } catch (e) {
      // 错误提示已在 request 中处理
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择并上传文件
  async onUpload() {
    try {
      const choose = await new Promise((resolve, reject) => {
        wx.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['txt', 'md'],
          success: resolve,
          fail: reject,
        });
      });

      const file = choose.tempFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        wx.showToast({ title: '文件不能超过 10MB', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '上传处理中...', mask: true });
      const app = getApp();
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/api/knowledge/upload',
          filePath: file.path,
          name: 'file',
          formData: { filename: file.name },
          success: (r) => {
            const data = JSON.parse(r.data);
            r.statusCode >= 200 && r.statusCode < 300 ? resolve(data) : reject(data);
          },
          fail: reject,
        });
      });

      wx.hideLoading();
      wx.showToast({ title: `上传成功，入库 ${uploadRes.document.chunkCount} 块`, icon: 'none' });
      this.loadList();
    } catch (err) {
      wx.hideLoading();
      if (err && err.error) wx.showToast({ title: err.error, icon: 'none' });
    }
  },

  // 删除文档
  onDelete(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: `确定删除「${name}」？`,
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await request({ url: `/api/knowledge/${id}`, method: 'DELETE' });
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadList();
        } catch (e) {}
      },
    });
  },
});
