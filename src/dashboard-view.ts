import { ItemView, WorkspaceLeaf } from "obsidian";
import { computeStats, SobrietyStats } from "./stats";
import SobrietyTrackerPlugin from "./main";
import { DashboardPack } from "./lang";

export const VIEW_TYPE_DASHBOARD = "sobriety-dashboard";

export class DashboardView extends ItemView {
	private plugin: SobrietyTrackerPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: SobrietyTrackerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string { return VIEW_TYPE_DASHBOARD; }
	getDisplayText(): string { return "Sobriety Dashboard"; }
	getIcon(): string { return "calendar"; }

	async onOpen(): Promise<void> { await this.refresh(); }

	async refresh(): Promise<void> {
		const stats = await computeStats(this.app, this.plugin.settings.trackerFilePath);
		this.render(stats, this.plugin.L.dashboard);
	}

	private render(s: SobrietyStats, L: DashboardPack): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sobriety-dashboard");

		contentEl.createEl("h2", { text: L.title });

		// Streak card
		const card = contentEl.createDiv({ cls: "sobriety-card" });
		const emoji = s.streak >= 30 ? "🔥" : s.streak >= 7 ? "💪" : s.streak >= 1 ? "⭐" : "🌱";
		card.createEl("div", { cls: "sobriety-streak-num", text: `${s.streak}` });
		card.createEl("div", { cls: "sobriety-streak-label", text: `${emoji} ${s.streak} ${L.dayStreak}` });

		// Stats grid
		const grid = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.box(grid, L.successRate, `${s.successRate}%`, s.successRate >= 70 ? "green" : s.successRate >= 40 ? "yellow" : "red");
		this.box(grid, L.totalDays, `${s.totalDays}`, "default");
		this.box(grid, L.successful, `${s.totalSuccess}`, "green");
		this.box(grid, L.relapses, `${s.totalRelapse}`, "red");

		// Week
		contentEl.createEl("h3", { text: L.thisWeek });
		const wg = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.box(wg, L.successful, `${s.weekSuccess}`, "green");
		this.box(wg, L.relapses, `${s.weekRelapse}`, "red");

		// Month
		contentEl.createEl("h3", { text: L.thisMonth });
		const mg = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.box(mg, L.successful, `${s.monthSuccess}`, "green");
		this.box(mg, L.relapses, `${s.monthRelapse}`, "red");

		// Urge log
		contentEl.createEl("h3", { text: L.urgeLog });
		const ug = contentEl.createDiv({ cls: "sobriety-stats-grid" });
		this.box(ug, L.wins, `${s.totalUrgeWins}`, "green");
		this.box(ug, L.relapses, `${s.totalUrgeRelapses}`, "red");

		// Recent
		if (s.last7Entries.length > 0) {
			contentEl.createEl("h3", { text: L.recent });
			const list = contentEl.createEl("ul", { cls: "sobriety-recent" });
			for (const e of s.last7Entries) {
				const label = e.success ? L.successfulSuffix : L.relapseSuffix;
				const li = list.createEl("li", { text: `${e.date}  ${e.success ? "✓" : "✗"} ${label}` });
				li.style.color = e.success ? "var(--color-green)" : "var(--color-red)";
			}
		}

		const btn = contentEl.createDiv({ cls: "sobriety-dashboard-btn" });
		btn.createEl("button", { text: L.refresh }).onclick = () => this.refresh();
	}

	private box(container: HTMLElement, label: string, value: string, color: string): void {
		const b = container.createDiv({ cls: `sobriety-stat-box sobriety-stat-${color}` });
		b.createEl("div", { cls: "sobriety-stat-value", text: value });
		b.createEl("div", { cls: "sobriety-stat-label", text: label });
	}
}
