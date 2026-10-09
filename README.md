# 图标库 · GitHub + jsDelivr + GitHub Pages

一个零构建、零依赖的静态资源方案：**图标存在 GitHub 仓库里 → jsDelivr 提供 CDN 加速链接 → GitHub Pages 托管一个图标总览页，实时列出仓库里的所有图标，点一下即可复制各种格式的引用链接。**

```
icon-cdn/
├── index.html              # 图标总览页（本地双击可用，也部署到 Pages）
├── icons/                  # ← 你的图标都放这里（自带 7 个示例）
│   ├── bookmark.svg
│   ├── logo.svg
│   ├── note.png
│   ├── search.svg
│   ├── settings.svg
│   ├── star.svg
│   └── ui/
│       └── folder.svg
├── .github/workflows/pages.yml   # 自动部署 Pages（可选，方式 B）
└── .nojekyll               # 关闭 Jekyll 处理，避免下划线开头文件被忽略
```

---

## 一、一次性配置（约 5 分钟）

### 1. 建仓库并上传

在 GitHub 新建一个 **Public** 仓库，例如 `icons`，把本目录内容推上去：

```powershell
cd C:\Users\JT\Desktop\dsh\icon-cdn
git init -b main
git add -A
git commit -m "chore: icon library + gallery"
git remote add origin https://github.com/<你的用户名>/icons.git
git push -u origin main
```

> 如果本机没配 Git 凭据，也可以用网页版 **Add file → Upload files** 把 `icons/` 和 `index.html` 拖上去。

### 2. 改两处配置

`index.html` 顶部（约第 250 行）有一段默认配置，改 `owner` / `repo` / `pages`：

```js
var DEFAULTS = {
  owner:  'your-name',      // ← 你的 GitHub 用户名
  repo:   'icons',          // ← 仓库名
  branch: 'main',
  path:   'icons',          // ← 图标目录
  cdn:    'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{ref}',
  pages:  'https://your-name.github.io/icons'   // ← 你的 Pages 地址
};
```

配置也可以**不改代码**：打开页面 → 展开「⚙️ 仓库配置」→ 填好后点「保存并刷新」，配置存在浏览器 localStorage 里，只影响你自己。

### 3. 开启 GitHub Pages（二选一）

**方式 A：直接部署分支（最简单）**

仓库 → `Settings` → `Pages` → Source 选 `Deploy from a branch` → Branch 选 `main` / `/(root)` → Save。
等 1～2 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`。

**方式 B：用 Actions 部署（推荐，能自动注入构建时间）**

仓库 → `Settings` → `Pages` → Source 选 `GitHub Actions`，然后随便 push 一次即可。
本仓库已带 `.github/workflows/pages.yml`，每次 push 会自动重新部署，并在页面底部写入真实构建时间——**看到真实时间就说明 Pages 已经重新部署成功**（如果显示 `__BUILD_STAMP__`，说明走的不是方式 B）。

---

## 二、日常使用

### 上传新图标

把 SVG/PNG 放进 `icons/`（支持子目录）→ commit & push → 刷新总览页 → 点「↻ 刷新列表」。

**关于"实时"的一点说明**：总览页的列表是**每次打开/刷新时**通过 GitHub API 实时读取仓库目录得到的，所以 push 完刷新就能看到新图标，不需要重新部署 Pages。而图标文件本身走 jsDelivr，有缓存，见下一节。

### 拿到链接

总览页每个图标卡片都有按钮：

| 按钮 | 复制出的内容 |
|---|---|
| 复制链接 | `https://cdn.jsdelivr.net/gh/user/icons@main/icons/logo.svg` |
| MD | `![logo.svg](https://…)` |
| HTML | `<img src="https://…" alt="logo.svg" width="24" height="24">` |
| Pages | `https://user.github.io/icons/icons/logo.svg` |
| CSS | `background-image:url("https://…");` |

顶部还有「⧉ 复制全部链接」（按当前搜索过滤结果导出 Markdown 清单）和「↓ 导出 JSON」（生成 `icon-manifest.json`，可给构建脚本消费）。

### 三种链接怎么选

| 用途 | 推荐链接 | 说明 |
|---|---|---|
| 日常引用 | `cdn.jsdelivr.net/gh/...@main/...` | 有 CDN 缓存加速，国内多数地区可直连，但**约 12 小时缓存**，改了同名文件不会立刻生效 |
| 正式发版 | `cdn.jsdelivr.net/gh/...@v1.0.0/...` | 打 tag 后引用，**永久缓存**，永远指向那一版，不会因为后续改动而变 |
| 兜底 / 是否被墙 | `raw.githubusercontent.com/...` | 无 CDN，慢，但语义最直白；配置里可切换主前缀 |

**强烈建议的发布流程**：平时用 `@main` 图省事；确认稳定后打一次标签，对外文档里统一用标签版本：

```powershell
git tag v1.0.0
git push origin v1.0.0
```

然后在总览页把「分支 / 标签」改成 `v1.0.0`，即可生成 `@v1.0.0` 链接。

---

## 三、总览页功能清单

- **实时列表**：递归读取图标目录（最多 4 层），按文件名/路径排序，显示大小
- **搜索过滤**：输入即过滤（快捷键 `/` 聚焦，`Esc` 清空）
- **复制**：每张图 5 种格式；失败时自动回退 `execCommand`（`file://` 本地打开也能复制）
- **分页**：默认 96 个一屏，可改或「加载更多」
- **本地预览**：直接双击 `index.html` 也能用（只是列表要联网读 API）
- **手动清单兜底**：GitHub API 被墙/限流/私有仓库不便填令牌时，展开配置 →「手动清单模式」→ 每行粘贴一个路径 → 「应用清单」。此时页面完全不访问 API，链接和预览照常可用
- **可选令牌**：配置里可填 PAT（仅存本机 localStorage，可提高 API 配额、访问私有仓库）。⚠️ 公开仓库请勿填写，页面任何访问者都能读到该令牌
- **导出**：Markdown 清单 / JSON 清单

---

## 四、已知问题与排查

| 现象 | 原因与处理 |
|---|---|
| 页面提示「默认演示配置」 | `index.html` 里的 `DEFAULTS` 还是 `your-name/icons`，展开配置填入真实仓库并保存 |
| 列表空白，报 404 | 用户名/仓库名/分支/目录写错；注意目录不要写成 `/icons/` 或 `icons/`，填 `icons` 即可 |
| 报 403 / 429 | GitHub API 未登录配额 60 次/小时，刷新太频繁会触发；等一会儿，或填令牌 |
| 页面能开但列表读不到、图标也不显示 | 网络访问不了 `api.github.com` / `cdn.jsdelivr.net`。改用「手动清单模式」让列表可用；图标显示依赖能访问 CDN |
| 换了同名图标但引用处没变 | jsDelivr 的 `@分支` 缓存（约 12 小时）。可在链接后加版本号强制刷新，或直接改用 `@v1.0.0` 标签 |
| 图标包含中文/空格文件名 | 页面会对路径做 URL 编码，可以正常用；但仍建议图标文件名只用小写字母、数字、`-`，避免各种工具链踩坑 |
| 私有仓库 | 公开链接方案不适用（jsDelivr 无法读取私有仓库）。需要私有的话只能填令牌 + Raw 链接，但 Raw 链接带 token，不适合对外 |

---

## 五、设计约束（为什么这么做）

- **单文件、零依赖**：不引入任何前端框架/CDN 资源，避免"加速图标"的页面自己先被 CDN 拖死；离线也能打开
- **不对 GitHub API 做高频轮询**：只在打开/手动刷新时读一次，避免触发未登录限流
- **列表实时 / 文件走 CDN 缓存**：这是本方案最需要接受的取舍——新增图标立刻可见，**修改**已有同名图标要等缓存过期或改标签
- **令牌只存本机、明示风险**：不做任何"帮你保管密钥"的假承诺

---

## 六、本地自检（可选）

仓库里的 `test-server.js` 是**仅供本机验证**的 mock 服务，它模拟 GitHub Contents API 并托管静态文件，让你在没有 GitHub 账号、或 API 访问不了的情况下也能验证页面：

```powershell
cd C:\Users\JT\Desktop\dsh\icon-cdn
node test-server.js          # http://127.0.0.1:8765/
```

它包含三个测试钩子：

| 路径 | 作用 |
|---|---|
| `/test/mock-off` / `/test/mock-on` | 让 mock API 返回 503 / 恢复，用于验证"读取失败 → 手动清单兜底" |
| `/asset/{path}` | 本地替代 jsDelivr 前缀（缺少的文件返回 404，用于验证预览失败兜底） |

排查线上问题时**不需要**它，直接看页面上的错误提示即可。上线前可以删掉这个文件，它不参与部署。

---

## 七、验证记录

> 以下为交付前在本机实测的结果（Chromium + 本地 mock API，2026-10-09）。

| # | 验证项 | 命令/操作 | 结果 |
|---|---|---|---|
| 1 | 内联 JS 语法 | `node --check` 抽出 `<script>` 内容 | ✅ 通过 |
| 2 | 递归列目录 | mock 返回 `icons/` 含子目录 `ui/` | ✅ 8 个文件，`icons/ui/*` 被递归读到 |
| 3 | 非图片过滤 | mock 返回 `README.md` | ✅ 未出现在列表中 |
| 4 | 复制 CDN 链接 | 点击「复制」→ 回读剪贴板 | ✅ `…/icons/bookmark.svg` 一致 |
| 5 | 复制 Markdown | 点击「MD」→ 回读剪贴板 | ✅ `![bookmark.svg](…)` |
| 6 | 批量复制 | 点「复制全部链接」 | ✅ 8 行合法 Markdown |
| 7 | 搜索过滤 | 输入 `folder` / `ui/` | ✅ 分别命中 1 / 2 个，`Esc` 清空恢复 8 个 |
| 8 | 导出 JSON | 点「导出 JSON」 | ✅ 下载 `icon-manifest.json` |
| 9 | 预览失败兜底 | 请求不存在的 `close.webp` | ✅ 显示「预览加载失败 + 文件名」，不出现破图 |
| 10 | 首次打开引导 | 清空 localStorage 后刷新 | ✅ 红条提示"还没配置你自己的仓库"并指路配置面板 |
| 11 | API 失败兜底 | `/test/mock-off` 后刷新 | ✅ 报错并提供「手动清单模式」入口 |
| 12 | 手动清单 | 粘贴含注释/空行的 5 行文本 | ✅ 正确解析出 3 个图标 |
| 13 | `file://` 本地打开 | 双击 `index.html` 后点复制 | ✅ 剪贴板被真实覆盖，功能不依赖服务器 |
| 14 | 窄屏 375px | 检查 `scrollWidth` | ✅ 无横向溢出，按钮不换行 |
| 15 | 亮/暗主题 | `prefers-color-scheme` 切换 | ✅ 两套配色均可读 |

复现方式见上一节；截图在 `shots/`（已 gitignore，不随仓库上传）。

