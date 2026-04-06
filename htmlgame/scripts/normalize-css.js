const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'mui.css');
const backupPath = path.join(__dirname, '..', 'client', 'mui.css.bak');

function convertLine(line) {
  // 转换整行以 // 开头的注释
  if (/^\s*\/\//.test(line)) {
    const content = line.replace(/^\s*\/\//, '').trimEnd();
    return `/* ${content} */`;
  }
  // 转换行内尾注释 // ... 为 /* ... */
  // 忽略 URL 中的 //（如 http://），尽量只转换属性或选择器后的注释
  const idx = line.indexOf('//');
  if (idx !== -1) {
    const before = line.slice(0, idx);
    const after = line.slice(idx + 2);
    // 如果 // 前有 : 或 ; 或 {，基本可判定为注释而非 URL 协议头
    if (/[:;{}\)]\s*$/.test(before) || /:\s*$/.test(before)) {
      return `${before}/* ${after.trimEnd()} */`;
    }
  }
  return line;
}

try {
  const css = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(backupPath, css, 'utf8');
  const normalized = css
    .split(/\r?\n/)
    .map(convertLine)
    // 移除连续的空行，保留最多一个
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(filePath, normalized, 'utf8');
  console.log('Normalized CSS saved. Backup at:', backupPath);
} catch (e) {
  console.error('Normalize failed:', e);
  process.exit(1);
}