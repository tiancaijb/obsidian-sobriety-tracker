import { App, PluginSettingTab, Setting } from "obsidian";
import SobrietyTrackerPlugin from "./main";

export interface SobrietySettings {
	/** Path to the tracker note (relative to vault root) */
	trackerFilePath: string;
	/** Urge timer duration in minutes */
	urgeTimerMinutes: number;
	/** Daily reminder time in "HH:MM" 24h format */
	reminderTime: string;
	/** Enable daily reminder */
	enableReminder: boolean;
}

export const DEFAULT_SETTINGS: SobrietySettings = {
	trackerFilePath: "sobriety-tracker.md",
	urgeTimerMinutes: 30,
	reminderTime: "20:30",
	enableReminder: true,
};

export class SobrietySettingTab extends PluginSettingTab {
	plugin: SobrietyTrackerPlugin;

	constructor(app: App, plugin: SobrietyTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("sobriety-settings");

		new Setting(containerEl)
			.setName("Tracker file path")
			.setDesc("Path to the note where daily check-ins and urge logs are recorded (relative to vault root)")
			.addText(text => text
				.setPlaceholder("sobriety-tracker.md")
				.setValue(this.plugin.settings.trackerFilePath)
				.onChange(async val => {
					this.plugin.settings.trackerFilePath = val || "sobriety-tracker.md";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Urge timer duration")
			.setDesc("How many minutes the urge timer should count down")
			.addSlider(slider => slider
				.setLimits(5, 120, 5)
				.setValue(this.plugin.settings.urgeTimerMinutes)
				.setDynamicTooltip()
				.onChange(async val => {
					this.plugin.settings.urgeTimerMinutes = val;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Enable daily reminder")
			.setDesc("Show a notification at the set time to prompt daily check-in")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableReminder)
				.onChange(async val => {
					this.plugin.settings.enableReminder = val;
					await this.plugin.saveSettings();
					if (val) {
						this.plugin.startReminder();
					} else {
						this.plugin.stopReminder();
					}
				}));

		new Setting(containerEl)
			.setName("Reminder time")
			.setDesc("Time for the daily check-in reminder (24h format)")
			.addText(text => text
				.setPlaceholder("20:30")
				.setValue(this.plugin.settings.reminderTime)
				.onChange(async val => {
					if (/^\d{2}:\d{2}$/.test(val)) {
						this.plugin.settings.reminderTime = val;
						await this.plugin.saveSettings();
						if (this.plugin.settings.enableReminder) {
							this.plugin.startReminder();
						}
					}
				}));
	}
}
