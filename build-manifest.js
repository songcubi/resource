#!/usr/bin/env node
/**
 * 生成 icons.json 清单文件。
 *
 *   node build-manifest.js            # 扫描 icons/（默认）
 *   node build-manifest.js assets     # 扫描其他目录
 *   node build-manifest.js icons icons/icons.json
 *
 * 清单文件与图标放在同一目录（默认 icons/icons.json），页面会优先读取它，
 * 这样「列出所有图标」就完全不依赖 GitHub API —— 不会再有 403 限流。
 * GitHub Actions 里已配置为每次 push 自动执行（见 .github/workflows/pages.yml）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIR = (process.argv[2] || 'icons').replace(/^[./\\]+|[./\\]+$/g, '');
const OUT = process.argv[3] || DIR + '/icons.json';

// 注意：不支持 SVGZ（Pages 不会用 Content-Encoding 返回它，浏览器无法解码）
const EXT = /\.(svg|png|jpe?g|gif|webp|avif|ico|bmp)$/i;
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', '.idea', '.vscode', 'shots']);

const files = [];
const SKIP_FILES = new Set([path.basename(OUT)]);   // 清单文件自身不纳入扫描

function walk(dir, relBase) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) {
    console.error(`[build-manifest] 目录不存在：${dir}/`);
    process.exitCode = 1;
    return;
  }
  for (const entry of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))) {
    const rel = relBase ? relBase + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      walk(path.join(dir, entry.name), rel);
    } else if (entry.isFile() && EXT.test(entry.name) && !SKIP_FILES.has(entry.name)) {
      const stat = fs.statSync(path.join(abs, entry.name));
      files.push({ name: entry.name, path: rel, size: stat.size, mtime: stat.mtime.toISOString().slice(0, 10) });
    }
  }
}

walk(DIR, DIR);

const manifest = {
  generatedAt: new Date().toISOString(),
  dir: DIR,
  count: files.length,
  totalSize: files.reduce((n, f) => n + f.size, 0),
  files
};

const outPath = path.join(ROOT, OUT);
const before = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';

// 供 CI 判断"仓库里的清单是否已过期"（忽略 generatedAt，只看文件列表）
function fileListOf(text) {
  try {
    const o = JSON.parse(text);
    return JSON.stringify((o.files || []).map((f) => [f.path, f.size]));
  } catch (e) {
    return null;
  }
}

const nextJson = JSON.stringify(manifest, null, 2) + '\n';
const changed = fileListOf(before) !== fileListOf(nextJson);

// 列表没变时保留原 generatedAt，避免 CI 每次推送都产生"仅时间戳不同"的提交
if (!changed && before) {
  try {
    manifest.generatedAt = JSON.parse(before).generatedAt || manifest.generatedAt;
  } catch (e) { /* 旧文件损坏则用新时间 */ }
}
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`[build-manifest] ${OUT}: ${files.length} 个文件，共 ${(manifest.totalSize / 1024).toFixed(1)} KB`);
if (!files.length) console.warn(`[build-manifest] 警告：${DIR}/ 下没有找到图片文件`);
console.log(changed ? '[build-manifest] manifest=changed' : '[build-manifest] manifest=unchanged');
