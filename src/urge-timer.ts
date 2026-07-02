import { App, Plugin, StatusBarItem } from "obsidian";
import { showConfirmModal } from "./confirm-modal";

export class UrgeTimer {
	private plugin: Plugin;
	private app: App;
	private statusBarItem: StatusBarItem;
	private remainingSeconds: number = 0;
	private totalSeconds: number = 0;
	private intervalId: number | null = null;
	private startTime: Date | null = null;
	private running: boolean = false;

	/** Callback when timer completes successfully */
	onVictory: (() => void) | null = null;
	/** Callback when timer is cancelled (relapse) */
	onRelapse: ((durationSeconds: number) => void) | null = null;

	constructor(plugin: Plugin, app: App) {
		this.plugin = plugin;
		this.app = app;
		this.statusBarItem = plugin.addStatusBarItem();
		this.statusBarItem.addClass("plugin-sobriety-tracker");
		this.updateDisplay();
	}

	get isRunning(): boolean {
		return this.running;
	}

	get elapsedSeconds(): number {
		if (!this.startTime) return 0;
		return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
	}


	start(durationMinutes: number): void {
		this.totalSeconds = durationMinutes * 60;
		this.remainingSeconds = this.totalSeconds;
		this.startTime = new Date();
		this.running = true;
		this.updateDisplay();

		this.intervalId = window.setInterval(() => {
			const elapsed = Math.floor((Date.now() - this.startTime!.getTime()) / 1000);
			this.remainingSeconds = Math.max(0, this.totalSeconds - elapsed);

			this.updateDisplay();

			if (this.remainingSeconds <= 0) {
				this.complete();
			}
		}, 200);

		new Notification("🛡️ Urge Timer Started", {
			body: `Target: ${durationMinutes} minutes. Stay strong!`,
		});
	}

	cancel(): void {
		if (!this.running) return;

		const elapsed = this.elapsedSeconds;
		this.stop();
		this.remainingSeconds = 0;
		this.updateDisplay();

		if (this.onRelapse) {
			this.onRelapse(elapsed);
		}

		new Notification("💔 Timer cancelled", {
			body: `You lasted ${Math.floor(elapsed / 60)} min ${elapsed % 60} sec. Keep trying!`,
		});
	}

	private complete(): void {
		this.stop();
		this.remainingSeconds = 0;
		this.updateDisplay();

		// Play a sound if possible
		try {
			const audioCtx = new AudioContext();
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.frequency.value = 880;
			osc.type = "sine";
			gain.gain.value = 0.3;
			osc.start();
			gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
			osc.stop(audioCtx.currentTime + 1);
		} catch (_) {
			// Audio not available, silently continue
		}

		new Notification("🎉 You did it!", {
			body: `You resisted the urge for ${Math.floor(this.totalSeconds / 60)} minutes!`,
		});

		if (this.onVictory) {
			this.onVictory();
		}
	}

	private stop(): void {
		this.running = false;
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private updateDisplay(): void {
		if (!this.running || this.remainingSeconds <= 0) {
			this.statusBarItem.setText("");
			this.statusBarItem.setCssProps({ display: "none" });
			return;
		}

		const min = Math.floor(this.remainingSeconds / 60);
		const sec = this.remainingSeconds % 60;
		this.statusBarItem.setText(`🛡️ ${min}:${sec.toString().padStart(2, "0")}`);
		this.statusBarItem.setCssProps({ display: "" });
	}

	/**
	 * Prompt the user to confirm relapse cancellation.
	 * Returns true if user confirmed.
	 */
	async confirmCancel(L: import("./lang").UrgeTimerPack): Promise<boolean> {
		const elapsed = this.elapsedSeconds;
		const min = Math.floor(elapsed / 60);
		const sec = elapsed % 60;
		let msg = L.confirmMsg;
		if (elapsed > 0) msg += `\n${L.heldStrong} ${min}m ${sec}s.`;
		return showConfirmModal(this.app, L.confirmTitle, msg, L.confirmOk, L.confirmCancel);
	}

	/**
	 * Silently stop without logging (for restart / fresh start).
	 */
	reset(): void {
		this.stop();
		this.remainingSeconds = 0;
		this.startTime = null;
		this.updateDisplay();
	}

	/**
	 * Format elapsed time for logging.
	 */
	formatElapsed(seconds: number): string {
		const min = Math.floor(seconds / 60);
		const sec = seconds % 60;
		return `${min} min ${sec} sec`;
	}

	unload(): void {
		this.stop();
		this.statusBarItem.remove();
	}
}
