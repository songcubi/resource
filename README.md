# 图标库

图标放在 `icons/` 目录，通过 **jsDelivr** 加速访问，页面托管在 GitHub Pages：
**https://songcubi.github.io/resource/**

---

## 更新图片：2 步

### 1. 把图片放进 `icons/`

支持 `.svg` `.png` `.jpg` `.jpeg` `.gif` `.webp` `.ico`，也支持子目录（如 `icons/ui/`）。
删除图片就是删掉文件。

### 2. 提交并推送

```powershell
git add -A
git commit -m "add icons"
git push
```

**完事。** 剩下的全自动：

- Actions 重新生成清单 `icons/icons.json` 并自动提交回仓库
- 自动部署到 Pages（约 1 分钟）

然后打开 https://songcubi.github.io/resource/ 点「↻ 刷新列表」即可看到。
想确认部署成功，去仓库 `Actions` 标签页看 `Deploy icon gallery to GitHub Pages` 是否变绿。

---

## 复制引用链接

页面里每个图标都有按钮，点一下即复制：

| 按钮 | 用途 |
|---|---|
| **复制** | 直接用：`https://cdn.jsdelivr.net/gh/songcubi/resource@main/icons/xxx.svg` |
| **MD** | 贴进 Markdown：`![xxx.svg](https://…)` |
| **HTML** | 贴进网页：`<img src="https://…" width="24">` |
| **CSS** | 用作背景图 |
| **Pages** | 走 Pages 域名（不经 CDN） |

顶部「⧉ 复制全部链接」可一次复制所有图标的 Markdown；「↓ 导出 JSON」导出清单。

---

## ⚠️ 唯一需要记住的规则

**新增**图片（新文件名）→ push 后立刻生效 ✅
**修改**已有图片（同名覆盖）→ 旧图还会被缓存一段时间 ⚠️

实测 jsDelivr 对 `@main` 的缓存策略是：**浏览器 7 天、CDN 边缘 12 小时**（`max-age=604800, s-maxage=43200`）。
所以同名覆盖后，可能有人立刻看到新图、有人还在看旧图。

要立刻让**所有人**看到，**换个新文件名**（如 `logo.svg` → `logo-v2.svg`）再 push。

---

## 常见问题

| 现象 | 解决 |
|---|---|
| push 后页面没变化 | 等 Actions 变绿（约 1 分钟），再点「↻ 刷新列表」 |
| 页面顶部黄色提示「● GitHub API 兜底」 | 清单没读到，等 Actions 跑完即可 |
| Actions 报 `Get Pages site failed` | `Settings → Pages → Source` 必须选 **GitHub Actions** |
| 「Pages」按钮的链接打不开 | 页面配置里「GitHub Pages 地址」要填 `https://songcubi.github.io/resource`（不是 github.com 仓库地址） |
| 改了图但引用处没变 | 见上面那条规则；换新文件名可立刻生效 |
| 页面完全打不开 | 先确认能访问 GitHub；若用了代理，注意代理可能缓存了旧页面 |

---

## 新增图片的建议

- **图标 / Logo** → 优先 `.svg`
- **位图** → 压到 100 KB 以内，大图用 WebP

---

## 文件说明

```
icons/                        所有图标放这里（含自动生成的 icons.json）
index.html                    图标库页面
.github/workflows/pages.yml   自动生成清单 + 自动部署
build-manifest.js             生成清单的脚本
.nojekyll                     关闭 Jekyll 处理（Pages 需要）
README.md                     本文件
```

日常更新只用改 `icons/`，其余文件都不用动。

> `build-manifest.js` 平时不需要手动跑（Actions 会自动执行）。
> 只有在你想**本地双击 `index.html` 直接预览**时，才需要跑一次 `node build-manifest.js`。
