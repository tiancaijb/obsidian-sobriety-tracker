import { ItemView, WorkspaceLeaf } from "obsidian";
import { computeStats, SobrietyStats } from "./stats";
import SobrietyTrackerPlugin from "./main";

export const VIEW_TYPE_DASHBOARD = "sobriety-dashboard";

export class DashboardView extends ItemView {
	private plugin: SobrietyTrackerPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: SobrietyTrackerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_DASHBOARD;
	}

	getDisplayText(): string {
		return "Sobriety Dashboard";
	}

	getIcon(): string {
		return "calendar";
	}

	async onOpen(): Promise<void> {
		await this.refresh();
	}

	async refresh(): Promise<void> {
		const stats = await computeStats(this.app, this.plugin.settings.trackerFilePath);
		this.render(stats);
	}

	private render(s: SobrietyStats): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sobriety-dashboard");

		// ── Header ──
		contentEl.createEl("h2", { text: "Sobriety Dashboard" });

		// ── Streak card ──
		const streakCard = contentEl.createDiv({ cls: "sobriety-card" });
		const streakEmoji = s.streak >= 30 ? "🔥" : s.streak >= 7 ? "💪" : s.streak >= 1 ? "⭐" : "🌱";
		streakCard.createEl("div", { cls: "sobriety-streak-num", text: `${s.streak}` });
		streakCard.createEl("div", { cls: "sobriety-streak-label", text: `${streakEmoji} day streak` });

		// ── Stats grid ──
		const grid = contentEl.createDiv({ cls: "sobriety-stats-grid" });

		this.statBox(grid, "Success rate", `${s.successRate}%`, s.successRate >= 70 ? "green" : s.successRate >= 40 ? "yellow" : "red");
		this.statBox(grid, "Total days", `${s.totalDays}`, "default");
		this.statBox(grid, "Successful", `${s.totalSuccess}`, "green");
		this.statBox(grid, "Relapses", `${s.totalRelapse}`, "red");

		// ── Week / Month summary ──
		contentEl.createEl("h3", { text: "This Week" });
		const weekGrid = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.statBox(weekGrid, "Successful", `${s.weekSuccess}`, "green");
		this.statBox(weekGrid, "Relapses", `${s.weekRelapse}`, "red");

		contentEl.createEl("h3", { text: "This Month" });
		const monthGrid = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.statBox(monthGrid, "Successful", `${s.monthSuccess}`, "green");
		this.statBox(monthGrid, "Relapses", `${s.monthRelapse}`, "red");

		// ── Urge log stats ──
		contentEl.createEl("h3", { text: "Urge Log" });
		const urgeGrid = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.statBox(urgeGrid, "Wins", `${s.totalUrgeWins}`, "green");
		this.statBox(urgeGrid, "Relapses", `${s.totalUrgeRelapses}`, "red");

		// ── Recent entries ──
		if (s.last7Entries.length > 0) {
			contentEl.createEl("h3", { text: "Recent" });
			const list = contentEl.createEl("ul", { cls: "sobriety-recent" });
			for (const e of s.last7Entries) {
				const li = list.createEl("li", {
					text: `${e.date}  ${e.success ? "✓ Successful" : "✗ Relapse"}`,
				});
				li.style.color = e.success ? "var(--color-green)" : "var(--color-red)";
			}
		}

		// ── Refresh button ──
		const btnDiv = contentEl.createDiv({ cls: "sobriety-dashboard-btn" });
		btnDiv.createEl("button", { text: "🔄 Refresh" }).onclick = () => this.refresh();
	}

	private statBox(container: HTMLElement, label: string, value: string, color: string): void {
		const box = container.createDiv({ cls: `sobriety-stat-box sobriety-stat-${color}` });
		box.createEl("div", { cls: "sobriety-stat-value", text: value });
		box.createEl("div", { cls: "sobriety-stat-label", text: label });
	}
}
