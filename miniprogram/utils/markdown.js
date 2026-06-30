// 轻量 Markdown 解析器：把 md 文本解析成小程序可渲染的节点数组
// 支持：标题、代码块、行内代码、加粗、斜体、无序/有序列表、引用、分隔线、链接、段落
// 返回: [{ type, content, items?, lang? }]
//   type: 'h1'|'h2'|'h3'|'code'|'quote'|'hr'|'ul'|'ol'|'p'
//   content: 行内节点字符串或富文本片段
//   items: 列表项数组（ul/ol 用）
//   lang: 代码语言（code 用）

function parseInline(text) {
  // 把行内 markdown 转成带标记的片段数组，供 wxml 用 rich-text 或分段渲染
  // 这里简化：返回原始文本，行内样式（加粗/行内代码）通过 wxml + 正则难以精细处理，
  // 故行内只做最基本的处理：返回 text。复杂的交给 rich-text。
  return text;
}

function parseMarkdown(md) {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (!line.trim()) {
      i++;
      continue;
    }

    // 代码块 ```
    const fence = line.match(/^```\s*(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结束 ```
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'h' + h[1].length, content: h[2].trim() });
      i++;
      continue;
    }

    // 分隔线
    if (/^(\*\*\*|---|___)\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 引用 >
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', content: quoteLines.join('\n') });
      continue;
    }

    // 无序列表 - * +
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // 有序列表 1.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // 普通段落（连续非空行合并）
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\*\*\*|---|___)\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', content: paraLines.join('\n') });
  }

  return blocks;
}

module.exports = { parseMarkdown };
