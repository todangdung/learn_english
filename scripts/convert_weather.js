import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Khởi tạo __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Sửa lại cách gọi path.join (bỏ chữ "path." trước __dirname)
const inPath = path.join(__dirname, '..', 'weather.txt');
const outPath = path.join(__dirname, '..', 'weather.json');

const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/);

const entries = [];
let current = null;

for (let line of lines) {
  if (!line.trim()) continue;

  if (/^[A-Za-z]/.test(line) && line.includes('\t')) {
    const parts = line.split('\t').map(p => p.trim());
    const first = parts[0] || '';
    const translation = parts[2] || '';
    const word = first.replace(/\s*\(.*$/,'').trim();
    current = { word, meaning: translation };
    entries.push(current);
  } else {
    if (current) {
      current.meaning = (current.meaning ? current.meaning + ' ' : '') + line.trim();
    }
  }
}

// Chuyển đổi format sang object { word: meaning }
const out = entries.reduce((acc, e) => {
  acc[e.word] = e.meaning.trim();
  return acc;
}, {});

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Done! Wrote to:', outPath);