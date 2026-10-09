# 图标库 · GitHub + jsDelivr + GitHub Pages

图标存在 GitHub 仓库 → jsDelivr 提供 CDN 加速链接 → GitHub Pages 托管一个总览页，**实时列出所有图标，点一下复制各种格式的引用链接**。

**本版本的关键改进：列目录不再依赖 GitHub API。** 早期版本打开页面要调 `api.github.com` 列目录，而国内出口 IP 极易撞上"未登录每小时 60 次"的 403 限流（这是实测踩到的真实故障）。现在改为读取仓库内的清单文件 `icons/icons.json`，页面**完全不访问 GitHub API**，只依赖静态文件。

```
icon-cdn/
├── index.html                    # 总览页（零依赖单文件）
├── build-manifest.js             # 生成 icons/icons.json 清单
├── icons/
│   ├── icons.json                # ← 清单文件（由脚本生成，需提交）
│   ├── bookmark.svg  logo.svg  note.png  search.svg  settings.svg  star.svg
│   └── ui/folder.svg
├── .github/workflows/pages.yml   # push 时自动生成清单 + 部署 Pages
└── .nojekyll  .gitignore
```

---

## 一、部署五步（按顺序做，别跳）

### 1. 上传文件到仓库

把 `index.html`、`build-manifest.js`、`.github/`、以及你的 `icons/` 一起 push。

### 2. 生成清单文件

```powershell
cd <项目目录>
node build-manifest.js
git add icons/icons.json build-manifest.js index.html
git commit -m "feat: 清单文件 + 免 API 的图标库"
git push
```

`icons/icons.json` **必须提交到仓库**——它就是页面的数据源。以后每新增/删除图标，重跑一次这个命令再 push。

### 3. 开启 Pages（两种模式，选一种并保持一致）

| | 方式 A：分支部署 | 方式 B：Actions 部署（推荐） |
|---|---|---|
| 设置 | `Settings → Pages → Source` = **Deploy from a branch**，选 `main` / `(root)` | `Settings → Pages → Source` = **GitHub Actions** |
| 清单更新 | 你本地跑 `build-manifest.js` 后 push | 每次 push 由 Actions **自动**重新生成 |
| 构建时间 | 显示 `__BUILD_STAMP__` 占位符 | 显示真实构建时间 |

> ⚠️ **最容易踩的坑**：如果 Source 选的是"分支"，但仓库里存在 `.github/workflows/pages.yml`，Actions 会运行并在 `configure-pages` 步骤失败，报错是
> `Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions`。
> 这不是代码问题，是模式不匹配：**要用 Actions 工作流，就必须把 Source 切成 GitHub Actions**；不想切成 Actions，就把 `.github/workflows/pages.yml` 删掉，只用方式 A。

### 4. 打开页面确认

访问 `https://<用户名>.github.io/<仓库名>/`，正常应看到：

```
已读取 N 个图片文件 · 数据源：同目录清单（不依赖 GitHub API） · 时间
```

顶部工具栏会显示绿色 `● 清单文件（推荐）`。若显示黄色的 `● GitHub API 兜底`，说明清单没读到，见排查表。

### 5. 改配置（如果 `index.html` 里的 DEFAULTS 不是你的仓库）

展开「⚙️ 仓库配置」填写，或直接改 `index.html` 里的 `DEFAULTS`：

```js
var DEFAULTS = {
  owner:  'songcubi',                           // GitHub 用户名
  repo:   'resource',                           // 仓库名
  branch: 'main',
  path:   'icons',                              // 图标目录（清单文件在此目录内）
  cdn:    'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{ref}',
  pages:  'https://songcubi.github.io/resource' // ← Pages 站点地址
};
```

> ⚠️ `pages` 必须填 **Pages 站点地址**（`https://用户名.github.io/仓库名`），**不是**仓库网页地址（`https://github.com/用户名/仓库名`）。填错会让「Pages」按钮生成打不开的链接。

---

## 二、日常使用

1. 把新图标放进 `icons/`（支持子目录）
2. `node build-manifest.js`
3. `git commit && git push`
4. 刷新总览页

> 方式 B（Actions）下第 2 步是自动的，但**清单文件必须已被提交过一次**，否则首次部署时仓库里没有它。

### 每个图标可复制 5 种链接

| 按钮 | 复制出的内容 |
|---|---|
| 复制 | `https://cdn.jsdelivr.net/gh/user/repo@main/icons/logo.svg` |
| MD | `![logo.svg](https://…)` |
| HTML | `<img src="https://…" alt="logo.svg" width="24" height="24">` |
| Pages | `https://user.github.io/repo/icons/logo.svg` |
| CSS | `background-image:url("https://…");` |

顶部还有「⧉ 复制全部链接」（按当前过滤导出 Markdown）和「↓ 导出 JSON」。

### 链接怎么选

| 用途 | 链接 | 说明 |
|---|---|---|
| 日常引用 | `…@main/…` | 有 CDN 加速，但**约 12 小时缓存**，改同名文件不会立刻生效 |
| 正式发版 | `…@v1.0.0/…` | 打 tag 后引用，**永久缓存**，不受后续改动影响 |
| 兜底 | `raw.githubusercontent.com/…` | 无 CDN，慢但稳；配置面板可切换 |

发布稳定版本：

```powershell
git tag v1.0.0
git push origin v1.0.0
```

然后把配置里的「分支 / 标签」改成 `v1.0.0`，即可生成 `@v1.0.0` 链接。

---

## 三、数据源与降级顺序

页面按以下顺序找数据，**前一步成功就完全不走 GitHub API**：

| 顺序 | 数据源 | 稳定性 |
|---|---|---|
| 1 | 同目录清单 `icons/icons.json`（Pages / 本地同源） | ✅ 最稳，推荐 |
| 2 | Pages 站点上的清单 | ✅ |
| 3 | jsDelivr 上的清单 | ⚠️ 有 12 小时缓存，新图标可能不立刻出现 |
| 4 | GitHub API 列目录 | ⚠️ 未登录 60 次/小时，国内易 403 |
| 5 | 手动清单模式 | ✅ 完全离线可用（配置面板里粘贴路径） |

第 4 步只为兼容"没生成清单"的仓库而保留；工具栏会黄色提示你尽快执行 `node build-manifest.js`。

---

## 四、排查表

| 现象 | 原因与处理 |
|---|---|
| Actions 在 `configure-pages` 失败：`Get Pages site failed` | Pages 的 Source 不是 GitHub Actions。改成 GitHub Actions 后 Re-run；或删掉 workflow 改用分支部署（见第一步第 3 节） |
| 红条 `读取失败 … 已尝试：同目录清单 → HTTP 404` | 仓库里没有 `icons/icons.json`。跑 `node build-manifest.js` 并 push |
| 黄条 `● GitHub API 兜底` | 清单没读到，正在用 API。检查清单路径是否与配置的目录一致 |
| 403 / 429 | GitHub API 限流。生成清单文件即可彻底绕开；或配置访问令牌 |
| 页面显示"还没配置你自己的仓库" | `index.html` 的 `DEFAULTS` 还是 `your-name/icons`，改掉或保存配置 |
| 「Pages」按钮的链接打不开 | `pages` 填成了仓库网页地址，应填 `https://用户名.github.io/仓库名` |
| 换了同名图标但引用处没变 | jsDelivr 的 `@分支` 缓存（约 12 小时）。改用 `@v1.0.0` 标签 |
| 图标能显示但列表为空 | 清单为空或格式不对；确认 `icons.json` 里 `files` 数组非空 |
| 私有仓库 | jsDelivr 读不到私有仓库。此方案仅适用于公开仓库 |

---

## 五、本地自检（可选）

```powershell
node test-server.js      # http://127.0.0.1:8765/
```

`test-server.js` 是**仅供本机验证**的 mock 服务（模拟 GitHub API + 托管静态文件 + 本地图片），不参与线上部署，可以直接删。

| 钩子 | 作用 |
|---|---|
| `/test/mock-off` `/test/mock-on` | 让 mock API 返回 503 / 恢复，验证"API 挂掉仍能靠清单工作" |
| `/asset/{path}` | 本地替代 jsDelivr 前缀 |

---

## 六、验证记录

> 交付前本机实测（Chromium + mock，2026-10-09）。"API 挂掉"场景全程返回 503。

| # | 验证项 | 结果 |
|---|---|---|
| 1 | 内联 JS / 脚本语法（`node --check`） | ✅ 通过 |
| 2 | **API 全程 503，仅靠清单渲染** | ✅ 7 个图标全部显示，**API 调用次数 = 0** |
| 3 | 清单候选降级链 | ✅ 前两个 404 → 自动落到可用候选 → 成功 |
| 4 | 递归子目录 | ✅ `icons/ui/folder.svg` 正常列出 |
| 5 | 复制 CDN / Markdown / 全部 | ✅ 回读剪贴板逐一比对一致 |
| 6 | Pages 链接生成 | ✅ `https://songcubi.github.io/resource/icons/bookmark.svg` |
| 7 | 搜索过滤 + `Esc` | ✅ 命中数与恢复均正确 |
| 8 | 导出 JSON | ✅ 下载 `icon-manifest.json` |
| 9 | 预览失败兜底 | ✅ 显示"预览加载失败 + 文件名" |
| 10 | 无清单 + 无 API | ✅ 明确提示生成 `icons.json`，并提供手动清单入口 |
| 11 | 清单自排除 | ✅ 连续两次生成 count 稳定为 7，不会把 `icons.json` 算进去 |
| 12 | `file://` 本地打开并复制 | ✅ 剪贴板被真实覆盖 |
| 13 | 窄屏 375px | ✅ 无横向溢出 |
| 14 | 真实仓库核验 | ✅ GitHub API 确认 `songcubi/resource` 的 `icons/` 内容；jsDelivr 返回真实 SVG；Pages 站点 200 |

截图在 `shots/`（已 gitignore）。
