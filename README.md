# dsh-font

为 DeepSeek Harness Web GUI 换字体的插件：**33 个界面字体 + 12 个代码字体**，
中文 / 西文 / WPS 经典字体全覆盖，中西文自动搭配，即选即生效，刷新不丢。

- 界面字体（改 `--dsw-font-family`）：正文、按钮、侧边栏、标题、菜单
- 代码字体（改 `--ds-font-family-code`）：代码块、终端、JSON 树、diff

## 安装

```powershell
# 1. 在 web profile 的 package.json 中注册（dependencies + dsh.profile.bundles）
# 2. 在 profile 目录安装
cd $env:USERPROFILE\.dsh\profiles\web
pnpm install --no-frozen-lockfile
# 3. 重启 dsh web，然后在 设置 → 常规 → 字体 中选择
```

## 使用

打开 **设置 → 常规**，找到「字体」行：

- **界面字体**：33 个选项（默认 / 21 个中文 / 11 个西文）
- **代码字体**：12 个选项（默认 / 11 个等宽）
- 下方有实时预览条；选择立即全局生效
- 「默认」恢复内置字体

## 字体清单

### 界面字体 — 中文（21）

| 选项 | 字体栈要点 |
|---|---|
| 微软雅黑 | Microsoft YaHei → Segoe UI |
| 思源黑体 | Noto Sans SC / Source Han Sans SC |
| 鸿蒙黑体 | HarmonyOS Sans SC |
| 苹方 | PingFang SC |
| 阿里巴巴普惠体 | Alibaba PuHuiTi |
| 霞鹜文楷 | LXGW WenKai → 楷体 |
| 思源宋体 | Noto Serif SC |
| 宋体 | SimSun → Times New Roman |
| 黑体 | SimHei |
| 仿宋 | FangSong → Times New Roman |
| 仿宋_GB2312 | FangSong_GB2312 |
| 楷体 | KaiTi |
| 等线 | DengXian |
| 华文中宋 | STZhongsong |
| 华文细黑 | STHeiti |
| 华文行楷 | STXingkai |
| 华文楷体 | STKaiti |
| 方正小标宋简体 | FZXiaoBiaoSong-B05S |
| 方正仿宋简体 | FZFangSong-Z02S |
| 方正书宋简体 | FZShuSong-Z01S |
| 幼圆 | YouYuan |

### 界面字体 — 西文（11）

Times New Roman、Arial、Calibri、Cambria、Georgia、Verdana、Tahoma、
Segoe UI、Helvetica、Garamond、Trebuchet MS

### 代码字体（11）

Consolas、Cascadia Code、JetBrains Mono、Fira Code、Source Code Pro、
Menlo、Monaco、Courier New、更纱黑体 Sarasa Mono SC、
等距更纱黑体 Sarasa Term SC、思源等宽 Noto Sans Mono

## 原理

Web shell 的所有字号 token（`--dsw-font-*`、`--dsw-font-markdown-*`）都引用
`:root` 上的两个变量；插件注入一个 `<style>` 覆盖这两个变量，一处生效、全局换肤，
不打包任何字体文件、不联网、不涉及付费字体。选择存于 localStorage
（`dsh-font:ui` / `dsh-font:code`）。

## 开发

```powershell
node --check client.js   # 语法检查（零构建，手写 CJS bundle）
```

- `cordis.patch.yml` — host 侧 loader 入口（`id: font`）
- `index.js` — host 半部（no-op）
- `client.js` — 浏览器半部（全部功能）
