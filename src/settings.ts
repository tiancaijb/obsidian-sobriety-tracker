import { App, PluginSettingTab, Setting } from "obsidian";
import SobrietyTrackerPlugin from "./main";
import { getLang, Lang } from "./lang";

export interface SobrietySettings {
	trackerFilePath: string;
	urgeTimerMinutes: number;
	reminderTime: string;
	enableReminder: boolean;
	language: Lang;
	reminderToleranceMinutes: number;
	lastReminderDate: string;
}

export const DEFAULT_SETTINGS: SobrietySettings = {
	trackerFilePath: "sobriety-tracker.md",
	urgeTimerMinutes: 30,
	reminderTime: "20:30",
	enableReminder: true,
	language: "en",
	reminderToleranceMinutes: 120,
	lastReminderDate: "",
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
		const L = getLang(this.plugin.settings.language).settings;

		new Setting(containerEl)
			.setName(L.trackerFilePath.name)
			.setDesc(L.trackerFilePath.desc)
			.addText(text => text
				.setPlaceholder("sobriety-tracker.md")
				.setValue(this.plugin.settings.trackerFilePath)
				.onChange(async val => {
					this.plugin.settings.trackerFilePath = val || "sobriety-tracker.md";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(L.urgeTimerDuration.name)
			.setDesc(L.urgeTimerDuration.desc)
			.addDropdown(drop => {
				[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].forEach(v =>
					drop.addOption(String(v), `${v} ${L.minutes}`));
				drop.setValue(String(this.plugin.settings.urgeTimerMinutes));
				drop.onChange(async val => {
					this.plugin.settings.urgeTimerMinutes = Number(val);
					await this.plugin.saveSettings();
				});
			});

		const reminderEnabled = this.plugin.settings.enableReminder;

		new Setting(containerEl)
			.setName(L.enableReminder.name)
			.setDesc(L.enableReminder.desc)
			.addToggle(toggle => toggle
				.setValue(reminderEnabled)
				.onChange(async val => {
					this.plugin.settings.enableReminder = val;
					await this.plugin.saveSettings();
					if (val) this.plugin.startReminder();
					else this.plugin.stopReminder();
					this.display();
				}));

		const timeSetting = new Setting(containerEl)
			.setName(L.reminderTime.name)
			.setDesc(L.reminderTime.desc)
			.addText(text => {
				text.inputEl.type = "time";
				text.setValue(this.plugin.settings.reminderTime);
				text.onChange(async val => {
					if (/^\d{2}:\d{2}$/.test(val)) {
						this.plugin.settings.reminderTime = val;
						await this.plugin.saveSettings();
						if (this.plugin.settings.enableReminder) this.plugin.startReminder();
					}
				});
			});
		timeSetting.settingEl.style.display = reminderEnabled ? "" : "none";

		const tolSetting = new Setting(containerEl)
			.setName(L.reminderTolerance.name)
			.setDesc(L.reminderTolerance.desc)
			.addDropdown(drop => {
				drop.addOption("0", L.disabled);
				[15, 30, 45, 60, 90, 120, 150, 180].forEach(v =>
					drop.addOption(String(v), `${v} ${L.minutes}`));
				drop.setValue(String(this.plugin.settings.reminderToleranceMinutes));
				drop.onChange(async val => {
					this.plugin.settings.reminderToleranceMinutes = Number(val);
					await this.plugin.saveSettings();
				});
			});
		tolSetting.settingEl.style.display = reminderEnabled ? "" : "none";

		new Setting(containerEl)
			.setName(L.language.name)
			.setDesc(L.language.desc)
			.addDropdown(drop => {
				drop.addOption("en", "English");
				drop.addOption("zh", "中文");
				drop.setValue(this.plugin.settings.language);
				drop.onChange(async val => {
					this.plugin.settings.language = val as Lang;
					await this.plugin.saveSettings();
					// Re-render settings with new language
					this.display();
				});
			});
	}
}
