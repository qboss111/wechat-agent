const app = getApp();

/**
 * 统一请求封装
 * @param {Object} opts { url, method, data, header, loading }
 */
function request(opts) {
  const { url, method = 'GET', data, header, loading = true } = opts;
  if (loading) wx.showLoading({ title: '请求中...', mask: true });

  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + url,
      method,
      data,
      header: { 'content-type': 'application/json', ...header },
      success(res) {
        if (loading) wx.hideLoading();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const msg = (res.data && res.data.error) || `请求失败 (${res.statusCode})`;
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail(err) {
        if (loading) wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
}

module.exports = { request };
