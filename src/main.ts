import { Notice, Plugin } from "obsidian";
import { showConfirmModal } from "./confirm-modal";
import { DEFAULT_SETTINGS, SobrietySettings, SobrietySettingTab } from "./settings";
import { UrgeTimer } from "./urge-timer";
import { logDailyCheckin, logUrgeEvent, ensureTrackerFile, getStreak } from "./tracker";
import { VictoryModal } from "./victory-modal";
import { DashboardView, VIEW_TYPE_DASHBOARD } from "./dashboard-view";
import { getLang, Lang } from "./lang";

export default class SobrietyTrackerPlugin extends Plugin {
	settings!: SobrietySettings;
	urgeTimer!: UrgeTimer;
	private reminderIntervalId: number | null = null;

	// Convenience getter for current lang pack
	get L() { return getLang(this.settings.language); }

	async onload(): Promise<void> {
		await this.loadSettings();

		this.urgeTimer = new UrgeTimer(this, this.app);

		this.urgeTimer.onVictory = () => this.handleVictory();
		this.urgeTimer.onRelapse = (d) => this.handleRelapse(d);

		// ── Ribbon icon ──
		this.addRibbonIcon("shield", "Start urge timer", () => this.handleStartUrgeTimer());

		// ── Commands ──
		this.addCommand({
			id: "start-urge-timer",
			name: "Start urge timer",
			icon: "shield",
			callback: () => this.handleStartUrgeTimer(),
		});

		this.addCommand({
			id: "cancel-urge-timer",
			name: "Cancel urge timer (relapse)",
			icon: "x-circle",
			callback: async () => {
				if (!this.urgeTimer.isRunning) {
					new Notice(this.L.urgeTimer.noTimer);
					return;
				}
				const confirmed = await this.urgeTimer.confirmCancel(this.L.urgeTimer);
				if (confirmed) this.urgeTimer.cancel();
			},
		});

		this.addCommand({
			id: "daily-checkin-success",
			name: "Daily check-in: Successful day",
			icon: "check-circle",
			callback: () => this.dailyCheckin("success"),
		});

		this.addCommand({
			id: "daily-checkin-relapse",
			name: "Daily check-in: Relapse",
			icon: "x-circle",
			callback: () => this.dailyCheckin("relapse"),
		});

		this.addCommand({
			id: "open-tracker-file",
			name: "Open tracker file",
			icon: "file-text",
			callback: () => this.openTrackerFile(),
		});

		this.addCommand({
			id: "show-streak",
			name: "Show current streak",
			icon: "calendar",
			callback: () => this.showStreak(),
		});

		// ── Settings tab ──
		this.addSettingTab(new SobrietySettingTab(this.app, this));

		// ── Dashboard view ──
		this.registerView(VIEW_TYPE_DASHBOARD, (leaf) => new DashboardView(leaf, this));
		this.addCommand({
			id: "open-dashboard",
			name: "Open dashboard",
			icon: "calendar",
			callback: () => this.openDashboard(),
		});

		// ── Daily reminder ──
		if (this.settings.enableReminder) {
			this.startReminder();
			this.checkMissedReminder();
		}
	}

	onunload(): void {
		this.stopReminder();
		this.urgeTimer.unload();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// ── Urge timer ──

	private async handleStartUrgeTimer(): Promise<void> {
		if (this.urgeTimer.isRunning) {
			const U = this.L.urgeTimer;
			const ok = await showConfirmModal(this.app, U.confirmTitle, U.confirmMsg, U.confirmOk, U.confirmCancel);
			if (!ok) return;
			this.urgeTimer.cancel();
			return;
		}
		this.urgeTimer.start(this.settings.urgeTimerMinutes);
	}

	private handleVictory(): void {
		logUrgeEvent(this.app, this.settings.trackerFilePath, true, this.settings.urgeTimerMinutes)
			.catch(e => console.error("Failed to log victory:", e));
		new VictoryModal(this.app, this.settings.urgeTimerMinutes, this.L.victory).open();
	}

	private handleRelapse(durationSeconds: number): void {
		const durMin = Math.floor(durationSeconds / 60);
		logUrgeEvent(this.app, this.settings.trackerFilePath, false, durMin)
			.catch(e => console.error("Failed to log relapse:", e));
	}

	// ── Daily check-in ──

	private async dailyCheckin(status: "success" | "relapse"): Promise<void> {
		try {
			await logDailyCheckin(this.app, this.settings.trackerFilePath, status);
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`${this.L.reminder.recorded} ${streak} day${streak !== 1 ? "s" : ""}`);
		} catch (e) {
			new Notice(this.L.reminder.failed);
			console.error("Check-in error:", e);
		}
	}

	// ── Streak ──

	private async showStreak(): Promise<void> {
		try {
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`🔥 ${this.L.dashboard.dayStreak.replace("day streak", "")} ${streak} ${this.L.dashboard.dayStreak}`);
		} catch (e) {
			new Notice("❌ Could not calculate streak.");
		}
	}

	// ── Dashboard ──

	async openDashboard(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_DASHBOARD)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) return;
			await leaf.setViewState({ type: VIEW_TYPE_DASHBOARD, active: true });
		}
		workspace.revealLeaf(leaf);
	}

	// ── Open tracker file ──

	private async openTrackerFile(): Promise<void> {
		try {
			const file = await ensureTrackerFile(this.app, this.settings.trackerFilePath);
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
		} catch (e) {
			console.error("Failed to open tracker file:", e);
		}
	}

	// ── Daily reminder ──

	startReminder(): void {
		this.stopReminder();
		this.reminderIntervalId = window.setInterval(() => {
			if (!this.settings.enableReminder) return;
			const now = new Date();
			const cur = pad(now.getHours()) + ":" + pad(now.getMinutes());
			if (cur === this.settings.reminderTime && now.getSeconds() < 10) this.fireReminder();
		}, 60000);
	}

	private async fireReminder(): Promise<void> {
		const R = this.L.reminder;
		new Notice(R.notice);
		try { new Notification(R.notifTitle, { body: R.notifBody }); } catch (_) {}

		const success = await showConfirmModal(this.app, R.modalTitle, R.modalMsg, R.okSuccess, R.okRelapse);
		try {
			await logDailyCheckin(this.app, this.settings.trackerFilePath, success ? "success" : "relapse");
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`${R.recorded} ${streak} day${streak !== 1 ? "s" : ""}`);
		} catch (e) {
			new Notice(R.failed);
			console.error("Check-in error:", e);
		}

		// Mark reminder as fired for today
		this.settings.lastReminderDate = todayStr();
		await this.saveSettings();
	}

	/**
	 * On startup, check if today's reminder time has passed but is within tolerance.
	 * Only fires if the reminder hasn't been fired today yet. One-sided: only triggers
	 * when current time is AFTER the reminder time (never before).
	 */
	private async checkMissedReminder(): Promise<void> {
		const tol = this.settings.reminderToleranceMinutes;
		if (tol <= 0) return;

		const now = new Date();
		const today = todayStr();

		// Already fired today
		if (this.settings.lastReminderDate === today) return;

		// Parse reminder time as today's date
		const [h, m] = this.settings.reminderTime.split(":").map(Number);
		const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

		// Diff in minutes (positive = current is after target = missed)
		const diffMin = (now.getTime() - target.getTime()) / 60000;

		// Only fire if current time is AFTER reminder time AND within tolerance
		if (diffMin > 0 && diffMin <= tol) {
			console.log(`Sobriety: missed reminder by ${Math.round(diffMin)}m, firing within tolerance`);
			await this.fireReminder();
		}
	}

	stopReminder(): void {
		if (this.reminderIntervalId !== null) {
			window.clearInterval(this.reminderIntervalId);
			this.reminderIntervalId = null;
		}
	}
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
