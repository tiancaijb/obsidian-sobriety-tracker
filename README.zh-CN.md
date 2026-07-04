# Sobriety Tracker

> 一款 Obsidian 戒色打卡插件——冲动计时器、每日打卡提醒、连续天数仪表盘、胜利庆祝动画。数据存为纯文本 Markdown。

[English](./README.md) · [日本語](./README.ja.md)

---

## 这是什么？

Sobriety Tracker 把你的 Obsidian 变成个人自律助手。不靠意志力硬撑，而是给你一套结构化的工具：冲动计时器倒计时、每日打卡（错过可补卡）、仪表盘可视化进度。

所有数据存在一篇 Markdown 笔记里。无云、无账号、数据不出库。

## 功能特性

- **🛡️ 冲动计时器** — 欲望来了开一个倒计时。撑过去 = 胜利（粒子庆祝动画）。提前取消 = 破戒（自动记录）。时长可设（5–120 分钟）。
- **📅 每日打卡** — 定时提醒，一键记录「成功 ✓」或「破戒 ✗」。如果到点 Obsidian 没开，下次启动后在容差窗口内仍会触发。
- **📊 仪表盘** — 连续天数、成功率、周/月分解、冲动日志（胜利 vs 破戒）。数据自动从笔记汇总。
- **🎉 胜利动画** — 撑过一次冲动后，粒子爆炸庆祝。
- **🌐 三语支持** — English / 中文 / 日本語（设置里切换）。

## 安装

### 从 Obsidian 社区插件市场
搜索 **Sobriety Tracker**。

### 手动安装
1. 从 [latest release](https://github.com/tiancaijb/obsidian-sobriety-tracker/releases) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 复制到 `.obsidian/plugins/sobriety-tracker/`。
3. 在 Obsidian 设置中启用插件。

## 使用方法

1. 在命令面板中打开 **Sobriety Dashboard**。
2. 在 **设置 → Sobriety Tracker** 中配置提醒时间和冲动计时器时长。
3. 需要时点击侧边栏盾牌图标或使用命令 **Start urge timer**。
4. 每日打卡到点自动弹出，一键记录。

### 常用命令

| 命令 | 说明 |
|------|------|
| Start urge timer | 开启冲动倒计时 |
| Cancel urge timer (relapse) | 取消倒计时 = 记录破戒 |
| Daily check-in: Successful day | 标记今天成功 |
| Daily check-in: Relapse | 标记今天破戒 |
| Open dashboard | 查看统计和趋势 |
| Show current streak | 在通知中显示连续天数 |

## 设置项

| 设置 | 说明 |
|------|------|
| Tracker file path | 数据笔记路径（默认 `sobriety-tracker.md`） |
| Urge timer duration | 倒计时长度（5–120 分钟） |
| Enable daily reminder | 启用每日打卡提醒 |
| Reminder time | 提醒时间 |
| Missed reminder tolerance | 错过提醒后的补卡窗口（分钟） |
| Language | English / 中文 / 日本語 |

## 数据格式

所有数据存在一篇 Markdown 笔记中：

```markdown
## Daily Check-ins
- 2026-07-03 ✓
- 2026-07-02 ✗

## Urge Log
- 2026-07-03 14:30 ✓ 成功抵抗冲动，坚持 30 分钟
- 2026-07-02 22:15 ✗ 破戒，坚持 12 分钟
```

你可以随意编辑、备份、处理这个文件。

## 架构

插件分四个核心模块：

| 模块 | 职责 |
|------|------|
| `urge-timer.ts` | 倒计时 + 状态栏显示 |
| `tracker.ts` | 文件读写——打卡和冲动日志 |
| `stats.ts` | 连续天数计算 + 统计汇总 |
| `dashboard-view.ts` | ItemView 仪表盘 UI |

## 为什么做这个插件

这套系统最开始是用 Emacs 实现的（见 [LLM Wiki](https://github.com/tiancaijb/llm-wiki)）。但 Emacs 不是一直开着的——Obsidian 是。移植之后提醒终于能在需要的时候弹出来了。同时 Obsidian 插件生态也让我积累了 TypeScript 前端开发、用户产品、社区发布的经验。

## License

MIT
