# Sobriety Tracker

> An Obsidian plugin for sobriety recovery tracking — urge timer, daily check-in reminder, streak dashboard, victory celebration. All data in plain Markdown.

[中文](./README.zh-CN.md) · [日本語](./README.ja.md)

---

## What Is This?

Sobriety Tracker turns your Obsidian vault into a personal recovery companion. Instead of relying on willpower alone, it gives you structured tools — an urge timer countdown, a daily check-in system with missed-reminder catch-up, and a dashboard that visualizes your progress.

Everything is stored in a plain Markdown note. No cloud, no accounts, no data leaves your vault.

## Features

- **🛡️ Urge Timer** — Start a countdown when a craving hits. Complete it = victory (celebrated with animation). Cancel early = relapse (logged). Configurable duration (5–120 min).
- **📅 Daily Check-in** — Scheduled reminder at your chosen time. One-tap: "Successful ✓" or "Relapse ✗". If Obsidian is closed at reminder time, it fires within a configurable grace period on next launch.
- **📊 Dashboard** — Current streak, success rate, weekly/monthly breakdown, urge log (wins vs relapses). Data aggregated from your tracker note.
- **🎉 Victory Animation** — Particle burst celebration when you win an urge timer session.
- **🌐 Trilingual** — English / 中文 / 日本語 (switch in settings).

## Installation

### From Obsidian Community Store
Search **Sobriety Tracker** in Community Plugins.

### Manual
1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/tiancaijb/obsidian-sobriety-tracker/releases).
2. Copy to `.obsidian/plugins/sobriety-tracker/`.
3. Enable the plugin in Obsidian settings.

## Usage

1. Open **Sobriety Dashboard** via command palette.
2. Configure reminder time and urge timer duration in **Settings → Sobriety Tracker**.
3. Use **Start urge timer** from the ribbon icon (🛡️) or command palette when needed.
4. Daily check-in fires automatically at your configured time. One tap to record your day.

### Quick Commands

| Command | Description |
|---------|-------------|
| Start urge timer | Begin countdown |
| Cancel urge timer (relapse) | Cancel active timer = logged as relapse |
| Daily check-in: Successful day | Mark today as success |
| Daily check-in: Relapse | Mark today as relapse |
| Open dashboard | View stats and trends |
| Show current streak | Display streak in notification |

## Settings

| Setting | Description |
|---------|-------------|
| Tracker file path | Path to the data note (default: `sobriety-tracker.md`) |
| Urge timer duration | Countdown length (5–120 min) |
| Enable daily reminder | Toggle check-in notification |
| Reminder time | When to fire the reminder |
| Missed reminder tolerance | Catch-up window after missed reminder (minutes) |
| Language | English / 中文 / 日本語 |

## Data Format

All data lives in a single Markdown note:

```markdown
## Daily Check-ins
- 2026-07-03 ✓
- 2026-07-02 ✗

## Urge Log
- 2026-07-03 14:30 ✓ Urge resisted, stayed strong for 30 min
- 2026-07-02 22:15 ✗ Relapsed after 12 min
```

You can edit, backup, or process this file however you like.

## Architecture

The plugin has four core modules:

| Module | Responsibility |
|--------|---------------|
| `urge-timer.ts` | Countdown timer with status bar display |
| `tracker.ts` | File I/O — reading/writing check-in and urge log data |
| `stats.ts` | Streak calculation and statistics aggregation |
| `dashboard-view.ts` | ItemView showing the dashboard UI |

## Why This Plugin?

I originally built this system in Emacs (see [LLM Wiki](https://github.com/tiancaijb/llm-wiki)). But Emacs isn't always open. Obsidian is. Porting it meant reminders actually fire when I need them — and the Obsidian plugin ecosystem gave me experience with TypeScript, user-facing products, and community distribution.

## License

MIT
