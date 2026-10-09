# 图标库 · GitHub + jsDelivr + GitHub Pages（Actions 部署）

图标存在 GitHub 仓库 → jsDelivr 提供 CDN 加速链接 → GitHub Pages 托管总览页，**实时列出所有图标，点一下复制各种格式的引用链接**。

两个关键设计决定：

1. **列目录不依赖 GitHub API**：改为读取仓库内的清单文件 `icons/icons.json`。早期版本靠 `api.github.com` 列目录，国内出口 IP 极易撞上"未登录每小时 60 次"的 403 限流（实测踩到的真实故障）。现在页面**完全不访问 GitHub API**。
2. **只用 GitHub Actions 部署**：`Settings → Pages → Source` 必须是 **GitHub Actions**，由工作流每次 push 自动重新生成清单并发布。

```
icon-cdn/
├── index.html                    # 总览页（零依赖单文件）
├── build-manifest.js             # 生成 icons/icons.json 清单
├── icons/
│   ├── icons.json                # ← 清单文件（数据源，Actions 会自动重建）
│   ├── bookmark.svg  logo.svg  note.png  search.svg  settings.svg  star.svg
│   ├── TokenStar.png  TokenStar_light.png
│   ├── TokenStar_background.jpeg  TokenStar_Transparent_background.png
│   └── ui/folder.svg
├── .github/workflows/pages.yml   # 生成清单 → 校验 → 部署 Pages
└── .nojekyll  .gitignore
```

---

## 一、部署四步

### 1. 把 Pages 的 Source 切成 GitHub Actions（关键，先做）

`Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**。

> ⚠️ 这是最常见的失败点。若 Source 仍是 "Deploy from a branch"，工作流会在 `configure-pages` 步骤报：
> `Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions`
> 报错与代码无关，纯粹是模式不匹配。

### 2. 上传文件

需要上传到仓库根目录：

```
index.html
build-manifest.js
.github/workflows/pages.yml
icons/            （你的图标 + icons.json）
.nojekyll
.gitignore
```

### 3. 本地生成一次清单（可选但推荐）

```powershell
node build-manifest.js          # 生成 icons/icons.json
```

Actions 每次部署都会在服务器上重新生成它，所以**不是必须**；本地跑一次的好处是可以提前校验、并让 `file://` 直接打开页面时也有列表。

### 4. 提交并推送

```powershell
git add -A
git commit -m "feat: Actions 部署的图标库"
git push
```

推送后到 `Actions` 标签页看 `Deploy icon gallery to GitHub Pages` 是否全绿，然后访问 `https://<用户名>.github.io/<仓库名>/`。

---

## 二、工作流做了什么

| 步骤 | 作用 |
|---|---|
| `actions/checkout@v4` | 拉取仓库 |
| `node build-manifest.js` | **扫描 `icons/` 重新生成清单**，新图标自动进列表 |
| Stamp build time | 把 `__BUILD_STAMP__` 替换成真实 UTC 时间 |
| Validate output | 断言 `index.html` / `icons/icons.json` 存在、`files` 是数组、清单里每个路径都真实存在；有一项不满足就**中止部署**（避免把坏页面发上线） |
| Stage `_site/` | 只挑发布需要的文件（`index.html` + `icons/` + `.nojekyll`），避免把 `.git`、测试脚本一起发到线上 |
| `upload-pages-artifact` + `deploy-pages` | 发布 |

> Actions 会跑在 Ubuntu 上，本机不需要装任何东西（用仓库自带 Node 20）。

---

## 三、日常使用

1. 把新图标放进 `icons/`（支持子目录）
2. `git add -A && git commit -m "add icons" && git push`
3. 等 Actions 变绿，刷新总览页

> 走 Actions 时**不需要**本地跑 `build-manifest.js`——工作流会在服务器上重建。本地跑只是为了离线预览和提前校验。

### 每个图标可复制 5 种链接

| 按钮 | 复制出的内容 |
|---|---|
| 复制 | `https://cdn.jsdelivr.net/gh/user/repo@main/icons/logo.svg` |
| MD | `![logo.svg](https://…)` |
| HTML | `<img src="https://…" alt="logo.svg" width="24" height="24">` |
| Pages | `https://user.github.io/repo/icons/logo.svg` |
| CSS | `background-image:url("https://…");` |

顶部还有「⧉ 复制全部链接」（导出当前过滤结果的 Markdown）和「↓ 导出 JSON」。

### 链接怎么选

| 用途 | 链接 | 说明 |
|---|---|---|
| 日常引用 | `…@main/…` | 有 CDN 加速，但**约 12 小时缓存**，改同名文件不会立刻生效 |
| 正式发版 | `…@v1.0.0/…` | 打 tag 后引用，**永久缓存**，不受后续改动影响 |
| 兜底 | `raw.githubusercontent.com/…` | 无 CDN，慢但稳；配置面板可切换 |

```powershell
git tag v1.0.0
git push origin v1.0.0
```

打完后把配置里的「分支 / 标签」改成 `v1.0.0`，即可生成 `@v1.0.0` 链接。

---

## 四、⚠️ 图片体积（当前最大问题）

`icons/` 里几张真实素材偏大，**引用它们的页面每次都要下载这些体积**：

| 文件 | 像素 | 大小 | 判断 |
|---|---|---|---|
| `TokenStar_background.jpeg` | 2752×928 | 2.27 MB | 仅适合当背景图，不适合直接引用 |
| `TokenStar_light.png` | 2752×928 | 1.43 MB | 同上 |
| `TokenStar.png` | 1536×1536 | 1.13 MB | Logo 场景过大，512px 足够 |
| `TokenStar_Transparent_background.png` | 1536×1536 | 939.9 KB | 同上 |
| 其余 7 个 svg / 小 png | ≤ 32px | 共 ~3 KB | 正常 |

合计约 **5.74 MB**。CDN 能扛，但图标/Logo 的正确形态应该是**几十 KB**。建议：

- **Logo / 图标**：缩到 256–512px，PNG 用 8 位调色板或转 WebP，通常能降到 20–60 KB（约 95% 降幅）
- **背景 / Banner**：保留较大尺寸但转 WebP（质量 80），通常降到 100–300 KB
- 需要多种尺寸时，用文件名区分（`logo-64.webp` / `logo-512.webp`），页面会把它们都列出来

没有图形工具的话，可以用 Node + `sharp`，或告诉我，我可以直接生成压缩后的文件。

---

## 五、排查表

| 现象 | 原因与处理 |
|---|---|
| Actions 在 `configure-pages` 失败：`Get Pages site failed` | Pages 的 Source 不是 GitHub Actions，见第一步 |
| Actions 在 `Validate output` 失败 | 清单缺失或少图标，按日志里的 `::error::` 提示处理 |
| 红条 `读取失败 … 已尝试：同目录清单 → HTTP 404` | 仓库里没有 `icons/icons.json`，跑 `node build-manifest.js` 并 push |
| 黄条 `● GitHub API 兜底` | 清单没读到，正在用 API。确认图标目录与配置一致 |
| 403 / 429 | GitHub API 限流。清单存在时根本不会触发；否则配置访问令牌 |
| 「Pages」按钮链接打不开 | 配置里的 `pages` 填成了仓库网页地址，应填 `https://用户名.github.io/仓库名` |
| 换了同名图标但引用处没变 | jsDelivr 的 `@分支` 缓存（约 12 小时）。改用 `@v1.0.0` 标签 |
| 大图加载慢 | 见第四节，先压缩 |
| 私有仓库 | jsDelivr 读不到私有仓库，本方案仅适用于公开仓库 |

---

## 六、本地自检（可选）

```powershell
node test-server.js      # http://127.0.0.1:8765/
```

仅供本机验证的 mock 服务（模拟 GitHub API + 托管静态文件），不参与线上部署，可直接删。

| 钩子 | 作用 |
|---|---|
| `/test/mock-off` `/test/mock-on` | 让 mock API 返回 503 / 恢复，验证"API 挂掉仍能靠清单工作" |
| `/asset/{path}` | 本地替代 jsDelivr 前缀 |

---

## 七、验证记录

> 交付前本机实测（Chromium + mock，2026-10-09）。"API 挂掉"场景全程返回 403/503。

| # | 验证项 | 结果 |
|---|---|---|
| 1 | 全部脚本语法（`node --check`） | ✅ 通过 |
| 2 | **API 全程 403，仅靠清单渲染** | ✅ 11 个图标全部列出，**API 调用次数 = 0** |
| 3 | 11 张图真实加载 | ✅ `naturalWidth` 全部 > 0，无破图 |
| 4 | 清单候选降级链 | ✅ 前两个 404 → 自动落到可用候选 → 成功 |
| 5 | 大文件复制链接 | ✅ 复制出 `…@main/icons/TokenStar_background.jpeg` |
| 6 | 递归子目录 | ✅ `icons/ui/folder.svg` 正常列出 |
| 7 | 复制 CDN / Markdown / 全部 | ✅ 回读剪贴板逐一比对一致 |
| 8 | Pages 链接生成 | ✅ `https://songcubi.github.io/resource/icons/bookmark.svg` |
| 9 | 搜索过滤 + `Esc` | ✅ 命中数与恢复均正确 |
| 10 | 导出 JSON | ✅ 下载 `icon-manifest.json` |
| 11 | 无清单 + 无 API | ✅ 提示生成 `icons.json`，并提供手动清单入口 |
| 12 | 清单自排除 | ✅ 连跑两次 count 稳定，不会把 `icons.json` 算进去 |
| 13 | 工作流 staging + 校验逻辑 | ✅ 本地等价仿真通过；发布内容仅 `index.html` + `icons/` + `.nojekyll` |
| 14 | 文本文件编码 | ✅ 全 UTF-8 无 BOM，中文无乱码 |
| 15 | `file://` 本地打开并复制 | ✅ 剪贴板被真实覆盖 |
| 16 | 窄屏 375px | ✅ 无横向溢出 |

截图在 `shots/`（已 gitignore）。
