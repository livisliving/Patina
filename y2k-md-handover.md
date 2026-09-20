# Y2K.md — 项目 Handover（给新 session）

> **更名注记（2026-09-20）：产品现更名为 Patina（平台名），Y2K 保留为第 1 个风格包（taste pack）的名字。仓库目录已从 `~/Desktop/y2k-md` 移到 `~/Desktop/patina`，npm 包 `@y2k-md/*` → `@patina/*`，安装命令 `npx y2k-md init` → `npx patina init`。下文为 2026-09-18 的历史记录，保留原样，未回改。**

> 生成日期：2026-09-18。来源：一次关于"2026 年 6–9 月设计趋势 → 可 vibe code 的产品概念"的讨论。
> 这份文档是自足的：新 session 读完即可开始 Day 1，不需要原对话。

---

## 0. 一句话

**Y2K.md** = 一套让 AI 编程 Agent（Claude Code / Cursor / Codex / Stitch）直接"读懂"Y2K 美学的设计上下文包。
装进项目后，vibe code 出来的产品不再是 Inter 字体 + shadcn 灰卡片，而是铬合金、半透明塑料、泡泡按钮和 MSN 弹窗。

营销 hook：**"2026 年最反 AI 味的东西，是 1999 年对未来的想象。"**
定位：**Taste packs for AI coding agents**。Y2K 是第 1 个包，也是品牌主角；后续包：Frutiger Aero、瑞士风、Memphis、蒸汽波。

---

## 1. 背景：为什么做、为什么现在（趋势依据）

2026 年 6 月中–9 月中设计圈最热的话题，以及本产品踩中的点：

| 趋势 | 事实 / 日期 | 与 Y2K.md 的关系 |
|---|---|---|
| 设计变成 Agent 的上下文（DESIGN.md / SKILL.md / MCP） | Google Labs 2026-04 发布 DESIGN.md 规范（YAML tokens + Markdown 设计意图，alpha，`npx @google/design.md lint`）；Atlassian 2026-06-15 实测（比 MCP 多耗 92% tokens，适合原型/跨平台/主题化）；2026-08 State of AI in Design Systems 调查：20 个开源设计系统中 19 个有 MCP server、18 个有 agent skills、仅 2 个用 Code Connect | 美学第一次可以被打包成 Agent 能消费的文件并分发。这是产品形态的基础 |
| 反 AI 光滑感 / "Imperfect by Design" | Canva、Adobe 2026 趋势报告 + 2026-09 趋势文章：颗粒、手绘、不均匀字体、80–90 年代与早期互联网复古、超大变形字、高对比撞色 | 所有 vibe code 产品长得一样是设计师最大痛点；Y2K 是 AI 味的极端反面 |
| Figma Config 2026（2026-06-24） | Shader 填充与效果（WebGPU）、3D 变换、Figma Motion、Code Layers、Agent skills（8 月起可在 Figma 内用 Markdown 写） | 铬反射、半透明塑料等 Y2K 核心材质现在浏览器和 Figma 都能原生表达；可通过 Figma MCP `create_shader` 把材质推进 Figma |
| Liquid Glass 第二年（WWDC 2026-06，iOS 27 9 月推送） | 透明度滑块、边缘加深、高光更亮 | Liquid Glass 本质是 2000 年 Mac OS X Aqua 的孙子——叙事上的自然联结 |
| 设计师角色重构 | Andy Budd《Bull and Bear Case》(Smashing, 2026-07-29)；NN/g「Custodial Era of UX」；AI in Design Report 2026（2026-09-16，900+ 设计师）：91% 每周用 AI、约一半已把 AI 生成代码部署到生产 | 目标用户就是这群"自己 vibe code、但受不了产出没有品味"的设计师 |

---

## 2. 产品模块

| 模块 | 内容 | 分发形式 |
|---|---|---|
| `DESIGN.md` | 符合 Google 规范。Tokens：铬银 / 电光蓝 / 泡泡糖粉 / 酸性绿 / 全息渐变；字阶（宽体 Eurostile 类 + 像素字 + 泡泡展示字）；泡泡圆角；斜面/浮雕；动效规则（弹跳、故障、跑马灯、鼠标拖尾）；**反规则**（禁止 Inter/Geist 默认字体、中性灰卡片、紫蓝 AI 渐变、一切 8px 圆角） | 仓库根目录文件 |
| `SKILL.md` × 4 | `/y2k-ify`（用 Claude 视觉分析现有页面截图，重写为 Y2K 组件）、`/make-window`（把任意区块包进 XP / OS 9 窗口）、`/chrome-text`（铬字效果）、`/check-y2k`（lint：有没有偷偷长回 AI 味） | `.claude/skills/*/SKILL.md` |
| 材质库 | GLSL / WebGPU shader：铬反射、全息箔、iMac G3 半透明塑料、镜头光晕、CRT 扫描线。每个材质给 CSS 降级方案（渐变 + backdrop-filter） | React 组件 + 独立 `.glsl` |
| 组件主题 | shadcn 自定义 registry：斜面铬 Button、半透明 Card、带标题栏的 Dialog（窗口）、拨号上网 Progress、MSN "Nudge" Toast、文件夹 Tabs、Marquee、访客计数器、留言板、鼠标拖尾 | `npx shadcn add https://y2k.md/r/button.json` |
| 主题切换 | 不是 light / dark，而是三个 Y2K 子流派：**Chrome / Bubblegum / Aero** | CSS 变量 + `data-theme` |
| 安装器 | `npx y2k-md init` → 复制 DESIGN.md + skills，配置 `components.json` 指向 registry | npm 包 |
| 官网 = Demo | **Y2K OS**：网页桌面，每个功能一个可拖动窗口；"开始菜单"= 文档；"回收站"= before/after（拖入无聊 shadcn 页面 → 吐出 Y2K 版）。官网自身用本包 vibe code 出来（dogfooding） | Next.js on Vercel |

---

## 3. 视觉方向

> **2026-09-18 晚更新（用户拍板，覆盖下面的"三个子主题"）：**
> 界面结构严格按 **Mac OS X 10.0 Aqua（2000–2001）**：整窗细条纹、三个红黄绿玻璃球、居中粗体标题、果冻药丸按钮（默认按钮会呼吸）、半透明 Dock、蓝色漩涡壁纸的同构。参考 https://infinitemac.org/2000/Mac%20OS%20X%2010.0 与用户给的两张截图。
> 颜色改成 **"tone"（色调）切换**，默认 **hot pink（McBling：Juicy Couture 丝绒、粉色 Razr、水钻、Hello Kitty）**，可切 Aqua / Lime / Tangerine / Grape / Graphite。原 Chrome / Bubblegum / Aero 三子主题作废；Chrome 的铬地平线等材质保留为将来的 shader 素材。
> 调研结论见 6.6 节。

**三个子主题（已作废，留档）**

| 主题 | 主色 | 材质 | 参考 |
|---|---|---|---|
| Chrome（默认） | 铬银渐变（#C0C0C0 → #FFFFFF → #808080）、纯黑、电光蓝 #0066FF | 铬反射、拉丝金属、镜头光晕 | Cyber Y2K、The Designers Republic、早期 Nike/Sony 广告 |
| Bubblegum | 热粉 #FF69B4、婴儿蓝 #99CCFF、薰衣草、闪粉 | 果冻、glitter、蝴蝶/星星贴纸 | Blingee、Dollz、Hello Kitty 2000、Bratz |
| Aero | 光泽绿 #7FFF00、天蓝、水滴白 | 半透明塑料、水面反射、玻璃泡 | Mac OS X Aqua、iMac G3、Windows XP Luna、Frutiger Aero |

**字体（Google Fonts 开源，无授权问题）**
- 宽体科技感（Eurostile 替代）：Michroma、Orbitron、Audiowide、Syncopate
- 像素：Press Start 2P、Silkscreen、VT323、Pixelify Sans
- 泡泡展示：Bagel Fat One、Chango、Rubik Bubbles、Titan One
- 正文可读性兜底：Space Grotesk 或 IBM Plex Sans（但要通过 letter-spacing / 大小写规则去掉"默认感"）

**UI 语言参考**：Windows XP 窗口标题栏、Mac OS 9 铂金外观、MSN Messenger 好友列表与 Nudge、Winamp 皮肤、Geocities（访客计数器、under construction、webring）、Nokia 3310 像素图标

**动效**：弹跳 easing（overshoot）、间歇 glitch、marquee、鼠标星星拖尾、窗口打开缩放、拨号上网式分段加载

---

## 4. 技术栈与结构

- **框架**：Next.js（App Router）+ Tailwind v4 + shadcn（自定义 registry，输出 `/r/*.json`）
- **Shader**：react-three-fiber（或 raw WebGL 小封装）；每个材质附 CSS 降级
- **AI**：Claude API（`/y2k-ify` 用视觉能力：截图 → 结构化组件重写建议）。可用 Vercel AI SDK 调用；模型优先 Sonnet 5（成本）/ Opus 5（质量）
- **CLI**：Node 脚本，`npx y2k-md init`
- **部署**：Vercel
- **动手前先加载技能**：写 registry / 组件代码前先 `Skill(vercel:shadcn)`，写 Claude API 调用前先 `Skill(claude-api)`，做视觉方向前可加载 `Skill(frontend-design:frontend-design)`——三者的 API / 规范都在快速变化，不要凭记忆写
- **加分项**：Figma MCP `create_shader` / `use_figma` 把材质与组件推进 Figma（figma 插件 MCP 需先在交互式 session 里完成 OAuth 授权）

建议目录：
```
y2k-md/
├── DESIGN.md                  # 产品自己的 Y2K DESIGN.md（也是分发物）
├── .claude/skills/            # y2k-ify / make-window / chrome-text / check-y2k
├── apps/web/                  # Y2K OS 官网 + registry 输出 (/r/*.json)
├── packages/ui/               # 组件源码（registry 源）
├── packages/shaders/          # GLSL + React 封装 + CSS 降级
├── packages/cli/              # npx y2k-md init
└── examples/before-after/     # 一个默认 shadcn 页面 + Y2K 化结果
```

---

## 5. MVP 计划（一个周末）

**Day 1**
- [x] 写 `DESIGN.md`（Chrome 主题完整；Bubblegum / Aero 先只写 tokens），跑 `npx @google/design.md lint` 通过 ← 2026-09-18 完成：`~/Desktop/y2k-md/DESIGN.md`，lint 0 errors / 0 warnings（29 colors · 13 typography · 4 rounded · 15 spacing · 28 components）
- [x] 8 个核心组件进 registry：Button、Card、Dialog(Window)、Progress、Toast(Nudge)、Tabs、Marquee、VisitorCounter
  - [x] Button（Aqua 果冻药丸：`white` 常规 / `tone` 色调 / `isDefault` 呼吸默认键 × sm / md / lg / icon）← 2026-09-18 改为 Aqua 版，`packages/ui/src/registry/y2k/button.tsx`
  - [x] Dialog(Window)（`WindowFrame` 桌面窗口 + `Window` Radix Dialog；细条纹标题栏、红黄绿玻璃球、居中标题、Toolbar / Group / Well / StatusBar）← 2026-09-18 改为 Aqua 版，`packages/ui/src/registry/y2k/window.tsx`
  - [x] Sidebar(源列表)（`WindowSidebar` 175px 凹陷白栏 + `WindowSidebarItem` 满铺方形选中行·跟随 data-tone · `WindowSidebarGroup` 11px 粗体分组头）← 2026-09-19 新建（保真规格 C 档），`packages/ui/src/registry/y2k/sidebar.tsx`；桌面 Finder 侧边栏占位 `<aside>` 已替换（C4）
  - [x] registry 已可构建：`npm run registry:build` → `apps/web/public/r/{theme,button,window,sidebar}.json`
  - [x] Card、Progress、Toast(Nudge)、Tabs、Marquee、VisitorCounter ← 2026-09-19 全部抽成 registry 组件：Card→`Group`(Aqua 分组框,非灰卡)、`Progress`(tone 果冻条 + barber-pole 不定态,复用 y2k-barber keyframe)、`Tabs`(Radix,分段 segmented,选中段 tone 填充)、`Toast`→`Nudge`(Radix Toast,迷你 Aqua 窗口从 Dock 滑上 + 抖一下,新增 y2k-nudge-in/out keyframe)、`Marquee`(无缝循环跑马灯,hover 暂停,尊重 reduced-motion,y2k-marquee keyframe)、`VisitorCounter`(千禧 hit counter,tone 发光数码管)。全部进 index.ts + registry.json,`npm run registry:build` → `/r/*.json`(共 10 个)。Components 窗口已加各自 demo 展示,实测无报错
- [x] 2 个 shader：铬反射、半透明塑料（含 CSS 降级）← 2026-09-19 新建 `packages/shaders` workspace：`ShaderSurface`(通用 WebGL 全屏 quad runner,DPR resize + RAF + reduced-motion/无 WebGL 时回落)、`ChromeReflection`(环境反射带 + 高光扫掠 + 拉丝,CSS 降级=金属渐变)、`TranslucentPlastic`(tone 染色 iMac G3 果冻 + 内部焦散 + 光泽顶盖,CSS 降级=tone 径向渐变)。接进 web(transpilePackages + dep + install),Components 窗口「Materials」组展示,WebGL 实测两个 canvas 都在画
- [x] Y2K OS 首页：桌面 + 2–3 个可拖动窗口 ← 2026-09-18：Aqua 菜单栏（Radix DropdownMenu）+ 壁纸 + 5 个可拖动窗口（Y2K.md 文件夹 / About / Read Me / Components / Tone）+ Save 对话框 + Dock（悬停放大、运行三角）+ 色调切换，`apps/web/components/{desktop,menubar,dock,aqua-icons,use-drag}.tsx`
  - [x] 响应式布局修复 ← 2026-09-19：菜单栏单行不换行（`min-w-0 flex-nowrap` + 触发器/右簇 `shrink-0 whitespace-nowrap`，Help 与 File…Window 组 `hidden sm:flex`）；窗口 `<md` 走正常流不再飘出屏幕（新增 `useIsDesktop` 门控，只在 md+ 应用 left/top 绝对定位）；Finder 工具栏 `flex-wrap` + 搜索框 `<sm` 独占一行；根容器 `overflow-x-hidden` 兜底。390/768/1148 三档实测通过，桌面态像素不变，`apps/web/components/{menubar,desktop}.tsx`
  - [x] 桌面图标改用 Olivia 提供的 PNG 原图 ← 2026-09-19：`apps/web/public/icons/*.png` + `aqua-icons.tsx` 全部改为 `<img>`。folder/heart 按 data-tone 选对应色版（pink/aqua/lime/tangerine/grape，graphite 回退）；disk/bin/cd/doc/note/terminal 中性通用；Finder face 只有蓝版，其余 tone 用 CSS `--y2k-face-filter`（y2k.css 每个 data-tone 一行）适配；**doc.png 用于窗口内（简版）、note.png 用于 Dock（详版）**；Components 仍用原 SVG PillIcon（Olivia 指定）。PngIcon wrapper `h-full w-full` 修掉了图标只显示下半截的裁切问题
  - [x] /simplify 清理 ← 2026-09-19：抽 `useMediaQuery`（desktop+dock 共用）；`useActiveTone` N 个 MutationObserver → 1 个共享 `useSyncExternalStore`（useTone）；FaceIcon filter 移到 CSS var；6 个中性图标收成 `makePngIcon` 工厂；删无用 CdIcon；`cn()` 替换字符串拼接；`Record<Tone,string>` 强约束；红绿灯 kind→color 三重三元收进 LIGHTS 表
  - [x] 窗口 chrome 保真（对照真机参考）← 2026-09-19：① 红绿灯高光重做——小而锐的顶部高光（`h-32% w-52%`）+ 更弱底部 rim，不再是大模糊白团；② **只标题栏条**失焦时半透明（`opacity-70`，窗口 body 保持实心，不是整窗透明）；③ 工具栏 Back/View 按钮压平（弱化 before 高光 + 分隔线 0.25→0.12）；④ Dock 放大——`--y2k-dock-icon` 48→64px、`--y2k-dock-h` 56→70px（dock.tsx `BASE` 同步 64），图标填满白条居中。`window.tsx` + `desktop.tsx` + `dock.tsx` + `y2k.css`

**Day 2**
- [ ] `npx y2k-md init` 安装器
- [ ] `/y2k-ify` 与 `/check-y2k` 两个 skill
- [ ] before / after 演示：一个默认 create-next-app + shadcn 页面 → Y2K 版
- [ ] 部署到 Vercel

**Definition of Done**：在一个全新的 `create-next-app` 里跑 `npx y2k-md init`，然后对 Claude Code 说"做一个 landing page"，产出物一眼就是 Y2K，且 `/check-y2k` 通过。

---

## 6. 已定决策 / 未决问题

**已定**
- Y2K 是第一个也是主打风格包；产品叙事是"taste packs"平台
- ~~三个子主题作为主题切换（替代 light/dark）~~ → **2026-09-18 改为：结构固定为 Aqua（Mac OS X 10.0），颜色按 6 个"tone"切换，默认 hot pink**（`data-tone` on `<html>`）
- 官网必须让人一眼看懂"怎么用"：产品不是"把你正在看的网页变 Y2K"，而是"装进项目后你的 coding agent 产出的东西变 Y2K"（`npx y2k-md init` → agent 读 DESIGN.md → `/y2k-ify` 改造已有页面）。Read Me 窗口已按此写文案；Day 2 的 `/y2k-ify` + before/after 是让这个价值可被现场体验的关键
- 通过 shadcn registry + npx 分发；DESIGN.md 遵循 Google 规范
- 官网做成 Y2K OS 桌面，自身 dogfooding
- 变现：免费 DESIGN.md + 基础组件 → Pro（完整 shader 库 + 素材 + 托管 `/y2k-ify`）→ Team（用同一引擎生成"你品牌自己的风格包"）

**未决**
- 名称 / 域名可用性（y2k.md 是否可注册；备选：millennium.design、chrome.md、dialup.dev）
- shader 方案：r3f vs raw WebGL vs 纯 CSS 先上
- 像素字的可访问性底线（最小字号、正文禁用）← DESIGN.md 里已先按假设写死：像素字 ≥16px（Silkscreen 16 / VT323 18–28）、只用于单行、禁止正文；如不同意改 `## Typography` 那段
- MVP 是否包含 Figma 推送
- 定价数字

---

## 6.5 Day 1 session 记录（2026-09-18）

- 机器上没有 pnpm → monorepo 用 **npm workspaces**（`apps/*`、`packages/*`），Node 25 / npm 11
- 栈实际版本：Next.js 16.3.5（Turbopack）、Tailwind v4、shadcn CLI 4.21（unified `radix-ui` 包，函数式组件 + `data-slot`）、`@google/design.md` 0.4.0
- 组件源码里 `cn` 走 `@/lib/utils`（shadcn 规范，CLI 安装时会改写）；monorepo 内通过 `apps/web/tsconfig.json` paths 指向 `packages/ui/src/lib/utils.ts`
- DESIGN.md 的 linter 规则要点：未知顶层 key 会被 export 忽略并 warning → Bubblegum / Aero tokens 放在 `colors:` 下用 `bubblegum-*` / `aero-*` 前缀；没被 component 引用的非 MD3 颜色会报 orphan → 每个主题各挂了 5 个映射 component
- 主题切换已通过 `data-theme` + `y2k.css` 变量重映射跑通（Chrome 完整；Bubblegum / Aero 只是 tokens，视觉未打磨）
- 起 dev server：`npm run dev`（或 `.claude/launch.json` 的 `y2k-os`），http://localhost:3000
- 晚间返工：用户看过第一版（Win98 / Cyber Chrome 方向）后要求改成 Mac OS X 2000 Aqua + hot pink + 可切色调 → DESIGN.md、y2k.css、Button、Window、demo 全部重写为 Aqua × tone；lint 仍 0 errors / 0 warnings（40 colors · 10 typography · 5 rounded · 16 spacing · 32 components）
- 字体：UI 用系统 Lucida Grande 栈（不再加载 Michroma / Orbitron / 像素字）；只用 next/font 加载 EB Garamond 做 wordmark（About 窗口的 "Y2K.md"，对应 10.0 About 框的 Apple Garamond）
- 色调实现细节：`--y2k-gel-tone` 等含 var() 的自定义属性在**声明处**求值，所以 `[data-tone]` 选择器里要重新声明一次，局部 `data-tone` 的色块才会各显各色
- 下一步建议：Progress（barber pole）/ Tabs（segmented）/ Toast(Nudge) / Card→改成 Group 抽组件；然后 Day 2 的 `/y2k-ify` 优先（这是用户最关心的价值）

---

## 6.6 千禧年色系调研（2026-09-18，用于 tone 切换）

综合多篇 Y2K 配色文章（graphicloads 36 色 / my2000sstyle / whatcolorssuitme / Wikipedia Y2K aesthetic）、iMac G3 颜色档案（everymac / One Infinite Fruit）、McBling 资料（Aesthetics Wiki / Y2K Fusion）及用户的 Pinterest "Y2K pink" 板：

| Tone | 年代 · 场景 | 代表物 | primary / bright / container |
|---|---|---|---|
| **Pink（默认）** | 2001–06 · McBling | Juicy Couture 丝绒运动服、粉色 Motorola Razr、水钻、Hello Kitty、Bratz、Paris Hilton | #FF3D9E / #FF9AD1 / #C8107A |
| Aqua | 1998–01 · Bondi / Aqua | Bondi Blue iMac、Mac OS X Aqua 水感界面 | #4A9FF5 / #A4D2FF / #1D63C9 |
| Lime | 1999–02 · Cyber | iMac Lime、Nickelodeon slime、Matrix 终端绿 | #9BE11F / #D8FF85 / #4F9A0A |
| Tangerine | 1999–03 · Candy tech | iMac Tangerine、芬达、充气椅、橙色半透明塑料 | #FFA31A / #FFD57F / #D2690A |
| Grape | 2000–04 · Lavender | iMac Grape、MSN Messenger 紫、Lisa Frank、早期 Frutiger Aero | #9B6DE8 / #D0B6FF / #5E37B5 |
| Graphite | 1999–02 · Chrome | Power Mac G4、Nokia 银、全息箔、The Designers Republic | #8E98A8 / #CDD4DE / #59626F |

要点：
- 所有来源一致：Y2K 核心色 = **hot pink、婴儿蓝、铬银、酸性绿、黑**；时尚/音乐品牌偏 "cyber bubblegum + chrome"，科技/游戏偏 Matrix 绿
- iMac G3 五色（1999：Blueberry / Grape / Lime / Strawberry / Tangerine）是最有辨识度的"产品级"千禧色系，社区近似值：Bondi #178A9C、Blueberry #069AC0、Grape #64638F、Tangerine #FF9F1B、Lime #02AC3F、Strawberry #BF005D（Apple 从未公布官方 hex）。我们的 tone 在此基础上提亮饱和以适配果冻按钮
- McBling 的粉是**暖饱和的洋红粉**（Pinterest 板：丝绒、亮片、粉色翻盖机），不是马卡龙粉；DESIGN.md 里明确"never pastel"
- 未采纳：holographic / 彩虹箔（不是单一 tone，留作材质）、Frutiger Aero 蓝绿（2005+ 偏晚）、butter yellow（出现频率低）

参考链接：
- https://graphicloads.com/y2k-color-palette-hex-codes/
- https://my2000sstyle.com/y2k-color-palette/
- https://whatcolorssuitme.com/aesthetics/y2k/
- https://en.wikipedia.org/wiki/Y2K_aesthetic
- https://everymac.com/systems/apple/imac/faq/imac-g3-which-models-are-which-colors.html
- https://oneinfinitefruit.com/colors/
- https://aesthetics.fandom.com/wiki/McBling
- https://y2kfusion.com/blogs/y2k-blog/why-was-everything-pink-in-y2k-fashion
- https://www.pinterest.com/hooriabaloch15/y2k-pink/

---

## 7. 备选概念（若 Y2K.md 验证不成立）

1. **Buddy List**：MSN Messenger 式的 AI Agent 管理面板——每个 agent 是一个好友，在线 / 离开 / 忙碌 = 空闲 / 工作中 / 等审批，"Nudge" = 打断。踩 Agentic UX 趋势
2. **Blingee 2026**：AI 给图片加闪粉、铬字、蝴蝶的消费级病毒工具
3. **DESIGN.md 生成器 + Design System Agent-Readiness 体检**：输入网址 / Figma 文件 → 提取 tokens → 生成 DESIGN.md 并 lint；扫描设计系统仓库检查 MCP / Skills / Code Connect / DESIGN.md 覆盖率并评分。（这也是 Y2K.md 的 Team 层最终形态）

---

## 8. 给新 session 的启动 prompt（直接粘贴）

```
读一下 ~/Desktop/y2k-md-handover.md，这是一个叫 Y2K.md 的产品的完整 handover。
按第 5 节的 Day 1 清单开始：在 ~/Desktop/y2k-md 建 monorepo，先写 DESIGN.md（Chrome 主题完整，
遵循 Google DESIGN.md 规范并用 npx @google/design.md lint 校验），然后做铬 Button 和 Window(Dialog) 两个组件，
起 dev server 让我在浏览器里看到效果。视觉方向严格按第 3 节，反规则必须遵守。每完成一项就在 handover 文档里打勾。
```

---

## 9. 参考链接

- Figma Config 2026 recap — https://www.figma.com/blog/config-2026-recap/
- Google DESIGN.md 三层架构解读 — https://dev.to/aws-builders/agentsmd-skillmd-designmd-how-ai-instructions-split-into-three-layers-d0g
- Atlassian DESIGN.md 实测 — https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice
- Andy Budd, Bull and Bear Case — https://www.smashingmagazine.com/2026/07/bull-and-bear-case-digital-design-age-ai/
- NN/g, Custodial Era of UX — https://www.nngroup.com/articles/ai-ux-debt/
- AI in Design Report 2026 — https://stateofaidesign.com/
- Canva "Imperfect by Design" — https://www.canva.com/newsroom/news/design-trends-2026/
- Design Trends September 2026 — https://blog.mean.ceo/design-trends-september-2026/
- Liquid Glass in iOS 27 — https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/
- shadcn registry 文档 — https://ui.shadcn.com/docs/registry
