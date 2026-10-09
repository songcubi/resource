// 本地验证服务器：静态托管 icon-cdn/ + mock GitHub Contents API + mock 图片
// 仅用于本机测试，不参与线上部署。
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8765);
const OWNER = 'demo-user';
const REPO = 'icons';
const REF = 'main';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

// ---- mock API 开关：/test/mock-off 让 API 返回 503，用于测试失败兜底 ----
let mockOn = true;

function listing() {
  const now = new Date().toISOString();
  return [
    { name: 'bookmark.svg', path: 'icons/bookmark.svg', sha: 'a1', size: 300, type: 'file' },
    { name: 'logo.svg', path: 'icons/logo.svg', sha: 'a2', size: 520, type: 'file' },
    { name: 'search.svg', path: 'icons/search.svg', sha: 'a3', size: 210, type: 'file' },
    { name: 'settings.svg', path: 'icons/settings.svg', sha: 'a4', size: 1400, type: 'file' },
    { name: 'star.svg', path: 'icons/star.svg', sha: 'a5', size: 260, type: 'file' },
    { name: 'note.png', path: 'icons/note.png', sha: 'a6', size: 1500, type: 'file' },
    { name: 'README.md', path: 'icons/README.md', sha: 'a7', size: 90, type: 'file' }, // 非图片，应被过滤
    { name: 'ui', path: 'icons/ui', sha: 'b1', size: 0, type: 'dir', url: `http://127.0.0.1:${PORT}/repos/${OWNER}/${REPO}/contents/icons/ui?ref=${REF}` }
  ].map(o => Object.assign({
    type: 'file',
    html_url: `https://github.com/${OWNER}/${REPO}/blob/${REF}/${o.path}`,
    download_url: `http://127.0.0.1:${PORT}/asset/${o.path}`,
    url: `http://127.0.0.1:${PORT}/repos/${OWNER}/${REPO}/contents/${o.path}?ref=${REF}`
  }, o, { sha: o.sha + now.slice(0, 0) }));
}

function uiListing() {
  return [
    { name: 'folder.svg', path: 'icons/ui/folder.svg', sha: 'c1', size: 400, type: 'file' },
    { name: 'close.webp', path: 'icons/ui/close.webp', sha: 'c2', size: 900, type: 'file' }
  ].map(o => Object.assign({
    html_url: `https://github.com/${OWNER}/${REPO}/blob/${REF}/${o.path}`,
    download_url: `http://127.0.0.1:${PORT}/asset/${o.path}`,
    url: `http://127.0.0.1:${PORT}/repos/${OWNER}/${REPO}/contents/${o.path}?ref=${REF}`
  }, o));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = decodeURIComponent(url.pathname);
  const cors = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

  // ------- mock GitHub API -------
  if (p === '/repos/' + OWNER + '/' + REPO + '/contents/icons') {
    if (!mockOn) { res.writeHead(503, cors); return res.end('{"message":"mock api down"}'); }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
    return res.end(JSON.stringify(listing()));
  }
  if (p === '/repos/' + OWNER + '/' + REPO + '/contents/icons/ui') {
    if (!mockOn) { res.writeHead(503, cors); return res.end('{"message":"mock api down"}'); }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
    return res.end(JSON.stringify(uiListing()));
  }
  if (p.startsWith('/repos/')) {
    res.writeHead(404, Object.assign({ 'Content-Type': 'application/json' }, cors));
    return res.end('{"message":"Not Found"}');
  }

  // ------- mock 图片（给 CDN 前缀用的本地替代） -------
  // 前缀形如 http://127.0.0.1:8765/asset/{path}，而 {path} 已包含 icons/，
  // 所以这里把紧随其后的 "icons/" 前缀去掉，映射到真实文件。
  if (p.startsWith('/asset/')) {
    let rel = p.slice('/asset/'.length).replace(/^icons\//, '');
    const file = path.join(ROOT, rel);
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    // 不存在的资源返回 404，用于验证预览加载失败的兜底 UI
    res.writeHead(404); return res.end('not found');
  }

  // ------- 测试钩子 -------
  if (p === '/test/mock-off') { mockOn = false; res.writeHead(200, cors); return res.end('mock api OFF'); }
  if (p === '/test/mock-on') { mockOn = true; res.writeHead(200, cors); return res.end('mock api ON'); }

  // ------- 静态文件 -------
  let rel = p === '/' ? '/index.html' : p;
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock] serving ${ROOT} at http://127.0.0.1:${PORT}/`);
});
