// ArrayBuffer / Uint8Array -> UTF-8 字符串
// 处理流式分块中"中文多字节字符被截断"的边界问题
// 用法：维护一个全局 buffer，每次传入新分块，返回能安全解码的字符串

let pending = []; // 跨分块残留的未完成字节

function buf2str(arrayBuffer) {
  const newBytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  const bytes = [...pending, ...newBytes];
  pending = [];

  // 从末尾向前找最后一个完整 UTF-8 字符的边界
  // UTF-8 字符首字节高位标识该字符的字节数：
  //   0xxxxxxx -> 1 字节
  //   110xxxxx -> 2 字节
  //   1110xxxx -> 3 字节（中文常见）
  //   11110xxx -> 4 字节
  let safeLen = bytes.length;
  for (let i = bytes.length - 1; i >= 0 && i >= bytes.length - 4; i--) {
    const b = bytes[i];
    let charLen = 0;
    if ((b & 0x80) === 0) charLen = 1;
    else if ((b & 0xe0) === 0xc0) charLen = 2;
    else if ((b & 0xf0) === 0xe0) charLen = 3;
    else if ((b & 0xf8) === 0xf0) charLen = 4;

    if (charLen > 0) {
      const remain = bytes.length - i;
      if (charLen > remain) {
        // 该字符还没收完，i 及之后的字节留到下次
        safeLen = i;
      } else {
        safeLen = bytes.length;
      }
      break;
    }
  }

  const safe = bytes.slice(0, safeLen);
  pending = bytes.slice(safeLen);

  // 解码为 UTF-8 字符串
  try {
    return decodeUtf8(safe);
  } catch (e) {
    return '';
  }
}

// 手动 UTF-8 解码（兼容性最好）
function decodeUtf8(bytes) {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let cp;
    if (b < 0x80) {
      cp = b;
      i += 1;
    } else if ((b & 0xe0) === 0xc0) {
      cp = ((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      cp = ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
      i += 3;
    } else if ((b & 0xf8) === 0xf0) {
      cp =
        ((b & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      i += 4;
      // 转成代理对（emoji 等 4 字节字符）
      cp -= 0x10000;
      const hi = 0xd800 + (cp >> 10);
      const lo = 0xdc00 + (cp & 0x3ff);
      result += String.fromCharCode(hi, lo);
      continue;
    } else {
      cp = b;
      i += 1;
    }
    result += String.fromCharCode(cp);
  }
  return result;
}

// 重置残留（新请求时调用）
function reset() {
  pending = [];
}

module.exports = { buf2str, reset };
