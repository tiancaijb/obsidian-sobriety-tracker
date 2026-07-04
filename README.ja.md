# Sobriety Tracker

> Obsidian 用の禁欲回復トラッカープラグイン——衝動タイマー、日次チェックインリマインダー、連続日数ダッシュボード、勝利祝賀アニメーション。データはすべてプレーン Markdown で保存。

[English](./README.md) · [中文](./README.zh-CN.md)

---

## これは何？

Sobriety Tracker は Obsidian をあなたの個人用リカバリーコンパニオンに変えます。意志力だけに頼るのではなく、構造化されたツールを提供します——衝動が来たらカウントダウンタイマー、日次チェックイン（リマインダーキャッチアップ機能付き）、進捗を可視化するダッシュボード。

すべてのデータは一篇の Markdown ノートに保存されます。クラウドもアカウントも不要、データは vault から出て行きません。

## 機能

- **🛡️ 衝動タイマー** — 衝動が来たらカウントダウンを開始。耐え抜く = 勝利（アニメーション付き祝賀）。途中でキャンセル = 破戒（記録）。時間は 5〜120 分で設定可能。
- **📅 日次チェックイン** — 指定時間にリマインダー。ワンタップで「成功 ✓」または「破戒 ✗」。Obsidian が閉じている間にリマインダー時刻が過ぎても、次回起動時に設定された猶予時間内なら再通知。
- **📊 ダッシュボード** — 連続日数、成功率、週/月別内訳、衝動ログ（勝利 vs 破戒）。データはノートから自動集計。
- **🎉 勝利アニメーション** — 衝動タイマーに勝利すると、パーティクルバーストで祝賀。
- **🌐 三言語対応** — English / 中文 / 日本語（設定で切替）。

## インストール

### Obsidian コミュニティストアから
**Sobriety Tracker** を検索。

### 手動インストール
1. [最新リリース](https://github.com/tiancaijb/obsidian-sobriety-tracker/releases) から `main.js`、`manifest.json`、`styles.css` をダウンロード。
2. `.obsidian/plugins/sobriety-tracker/` にコピー。
3. Obsidian 設定でプラグインを有効化。

## 使い方

1. コマンドパレットから **Sobriety Dashboard** を開く。
2. **設定 → Sobriety Tracker** でリマインダー時刻とタイマー時間を設定。
3. サイドバーの盾アイコンまたはコマンドから **Start urge timer** を実行。
4. 日次チェックインは設定時刻に自動表示。ワンタップで記録。

### よく使うコマンド

| コマンド | 説明 |
|---------|------|
| Start urge timer | 衝動カウントダウン開始 |
| Cancel urge timer (relapse) | タイマーキャンセル = 破戒記録 |
| Daily check-in: Successful day | 今日を成功とマーク |
| Daily check-in: Relapse | 今日を破戒とマーク |
| Open dashboard | 統計と傾向を表示 |
| Show current streak | 連続日数を通知に表示 |

## 設定

| 設定 | 説明 |
|------|------|
| Tracker file path | データ保存ノートのパス（デフォルト: `sobriety-tracker.md`） |
| Urge timer duration | カウントダウン時間（5〜120 分） |
| Enable daily reminder | 日次チェックイン通知の有効/無効 |
| Reminder time | リマインダー時刻 |
| Missed reminder tolerance | リマインダーを逃した後のキャッチアップ猶予（分） |
| Language | English / 中文 / 日本語 |

## データ形式

すべてのデータは一篇の Markdown ノートに保存：

```markdown
## Daily Check-ins
- 2026-07-03 ✓
- 2026-07-02 ✗

## Urge Log
- 2026-07-03 14:30 ✓ 衝動に勝ち、30分耐えた
- 2026-07-02 22:15 ✗ 破戒、12分で倒れた
```

ファイルは自由に編集・バックアップ・処理できます。

## アーキテクチャ

プラグインは 4 つのコアモジュールで構成：

| モジュール | 責務 |
|-----------|------|
| `urge-timer.ts` | カウントダウンタイマー + ステータスバー表示 |
| `tracker.ts` | ファイル I/O——チェックインと衝動ログ |
| `stats.ts` | 連続日数計算 + 統計集計 |
| `dashboard-view.ts` | ItemView ダッシュボード UI |

## このプラグインを作った理由

このシステムは元々 Emacs で実装していました（[LLM Wiki](https://github.com/tiancaijb/llm-wiki) 参照）。しかし Emacs は常時起動しているわけではありません——Obsidian は違います。移植することで、リマインダーが本当に必要な時に届くようになりました。同時に、Obsidian プラグインエコシステムは TypeScript 開発、ユーザー向け製品、コミュニティ配信の経験を与えてくれました。

## License

MIT
