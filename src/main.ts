import { Notice, Plugin } from "obsidian";
import { showConfirmModal } from "./confirm-modal";
import { DEFAULT_SETTINGS, SobrietySettings, SobrietySettingTab } from "./settings";
import { UrgeTimer } from "./urge-timer";
import { logDailyCheckin, logUrgeEvent, ensureTrackerFile, getStreak } from "./tracker";
import { VictoryModal } from "./victory-modal";
import { DashboardView, VIEW_TYPE_DASHBOARD } from "./dashboard-view";

export default class SobrietyTrackerPlugin extends Plugin {
	settings!: SobrietySettings;
	urgeTimer!: UrgeTimer;
	private reminderIntervalId: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize urge timer
		this.urgeTimer = new UrgeTimer(this, this.app);

		// Wire timer callbacks
		this.urgeTimer.onVictory = () => {
			this.handleVictory();
		};

		this.urgeTimer.onRelapse = (durationSeconds) => {
			this.handleRelapse(durationSeconds);
		};

		// ── Ribbon icon ──
		this.addRibbonIcon("shield", "Start urge timer", () => {
			this.handleStartUrgeTimer();
		});

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
					new Notice("⏹ No timer running.");
					return;
				}
				const confirmed = await this.urgeTimer.confirmCancel();
				if (confirmed) {
					this.urgeTimer.cancel();
				}
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

		// ── Start daily reminder ──
		if (this.settings.enableReminder) {
			this.startReminder();
		}
	}

	onunload(): void {
		this.stopReminder();
		this.urgeTimer.unload();
	}

	// ── Settings ──

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// ── Urge timer ──

	private async handleStartUrgeTimer(): Promise<void> {
		if (this.urgeTimer.isRunning) {
			const ok = await showConfirmModal(this.app, "💔 Confirm Relapse", "Timer is running. Are you sure you want to relapse?", "Yes, relapse", "Keep going");
			if (!ok) return;
			this.urgeTimer.cancel();
			return;
		}
		this.urgeTimer.start(this.settings.urgeTimerMinutes);
	}

	private async handleVictory(): Promise<void> {
		try {
			await logUrgeEvent(this.app, this.settings.trackerFilePath, true, this.settings.urgeTimerMinutes);
		} catch (e) {
			console.error("Failed to log victory:", e);
		}

		// Show victory modal
		new VictoryModal(this.app, this.settings.urgeTimerMinutes).open();
	}

	private async handleRelapse(durationSeconds: number): Promise<void> {
		try {
			const durMin = Math.floor(durationSeconds / 60);
			await logUrgeEvent(this.app, this.settings.trackerFilePath, false, durMin);
		} catch (e) {
			console.error("Failed to log relapse:", e);
		}
	}

	// ── Daily check-in ──

	private async dailyCheckin(status: "success" | "relapse"): Promise<void> {
		try {
			await logDailyCheckin(this.app, this.settings.trackerFilePath, status);
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`✅ Check-in recorded! Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
		} catch (e) {
			new Notice("❌ Failed to record check-in. See console for details.");
			console.error("Check-in error:", e);
		}
	}

	// ── Streak display ──

	private async showStreak(): Promise<void> {
		try {
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`🔥 Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
		} catch (e) {
			new Notice("❌ Could not calculate streak.");
			console.error("Streak error:", e);
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

		const checkInterval = 60 * 1000; // Check every minute

		this.reminderIntervalId = window.setInterval(() => {
			if (!this.settings.enableReminder) return;

			const now = new Date();
			const currentMin = pad(now.getHours()) + ":" + pad(now.getMinutes());
			const currentSec = now.getSeconds();

			if (currentMin === this.settings.reminderTime && currentSec < 10) {
				this.fireReminder();
			}
		}, checkInterval);
	}

	private async fireReminder(): Promise<void> {
		// Obsidian in-app notice
		new Notice("🔔 Sobriety check-in time! How was today?");

		// Web/Electron notification (system-level popup)
		try {
			new Notification("🔔 Sobriety Check-in", {
				body: "Time for your daily check-in! How was today?",
			});
		} catch (_) {
			// Notification API not available
		}

		// Ask user via modal: successful or relapse?
		const success = await showConfirmModal(
			this.app,
			"🔔 Daily Check-in",
			"How was today?",
			"Successful ✓",
			"Relapse ✗"
		);

		try {
			await logDailyCheckin(this.app, this.settings.trackerFilePath, success ? "success" : "relapse");
			const streak = await getStreak(this.app, this.settings.trackerFilePath);
			new Notice(`✅ Check-in recorded! Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
		} catch (e) {
			new Notice("❌ Failed to record check-in. Open tracker file to do it manually.");
			console.error("Check-in error:", e);
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
