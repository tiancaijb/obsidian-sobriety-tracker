# Sobriety Tracker

An Obsidian plugin for sobriety recovery tracking — urge timer, daily check-in, streak dashboard.

## Features

### 🛡️ Urge Timer
- Start a countdown timer when you feel an urge
- Stay strong until the timer runs out
- Cancel early = relapse (logged)
- Win = logged as victory

### 📅 Daily Check-in
- Scheduled reminder (configurable time)
- One-tap: "Successful ✓" or "Relapse ✗"
- Missed reminder catch-up: if Obsidian is closed at reminder time, it fires within a configurable grace period

### 📊 Dashboard
- Current streak (consecutive successful days)
- Success rate
- Weekly and monthly breakdown
- Urge log (wins vs relapses)

### 🌐 Bilingual
- English / 中文 (switch in settings)

## Usage

1. Install and enable the plugin
2. Open **Sobriety Dashboard** via command palette
3. Configure reminder time and urge timer duration in settings
4. Use **Start urge timer** from ribbon icon or command palette when needed

## Settings

| Setting | Description |
|---------|-------------|
| Tracker file path | Path to the note where data is stored |
| Urge timer duration | Countdown duration (5–120 min) |
| Enable daily reminder | Toggle the daily check-in notification |
| Reminder time | When to fire the daily reminder |
| Missed reminder tolerance | How long after the reminder time to still catch up |
| Language | English / 中文 |

## Data Format

Data is stored in a markdown note (default: `sobriety-tracker.md`):

```markdown
## Daily Check-ins
- 2026-07-03 ✓

## Urge Log
- 2026-07-03 14:30 ✓ Urge resisted, stayed strong for 30 min
```

## Installation

### From Obsidian Community Store
Search "Sobriety Tracker" in Community Plugins.

### Manual
1. Download `main.js`, `manifest.json`, `styles.css` from [latest release](https://github.com/tiancaijb/obsidian-sobriety-tracker/releases)
2. Copy to `.obsidian/plugins/sobriety-tracker/`
3. Enable plugin in Obsidian settings
