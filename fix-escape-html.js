const fs = require('fs');
let content = fs.readFileSync('C:\\Users\\mican\\Documents\\Findnord\\app.js', 'utf8');

// The correct escapeHtml function with proper HTML entities
const correctFunc = 'function escapeHtml(value) {\n  return String(value == null ? "" : value).replace(\n    /[&<>"\']/g,\n    (ch) => ({"&": "&", "<": "<", ">": ">", "\"": """, "\'": "'"})[ch]\n  );\n}';

// Find the start and end of the function
const startIdx = content.indexOf('function escapeHtml(value) {');
const endIdx = content.indexOf('}\n\n// Phase 3: simple debounce', startIdx);
if (startIdx >= 0 && endIdx >= 0) {
  content = content.substring(0, startIdx) + correctFunc + content.substring(endIdx + 1);
  fs.writeFileSync('C:\\Users\\mican\\Documents\\Findnord\\app.js', content);
  console.log('Fixed escapeHtml');
} else {
  console.log('Could not find function');
  console.log('Start:', startIdx, 'End:', endIdx);
}