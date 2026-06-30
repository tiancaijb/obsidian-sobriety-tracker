import { App, PluginSettingTab, Setting } from "obsidian";
import SobrietyTrackerPlugin from "./main";
import { getLang, Lang } from "./lang";

export interface SobrietySettings {
	trackerFilePath: string;
	urgeTimerMinutes: number;
	reminderTime: string;
	enableReminder: boolean;
	language: Lang;
}

export const DEFAULT_SETTINGS: SobrietySettings = {
	trackerFilePath: "sobriety-tracker.md",
	urgeTimerMinutes: 30,
	reminderTime: "20:30",
	enableReminder: true,
	language: "en",
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
			.addSlider(slider => slider
				.setLimits(5, 120, 5)
				.setValue(this.plugin.settings.urgeTimerMinutes)
				.setDynamicTooltip()
				.onChange(async val => {
					this.plugin.settings.urgeTimerMinutes = val;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(L.enableReminder.name)
			.setDesc(L.enableReminder.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableReminder)
				.onChange(async val => {
					this.plugin.settings.enableReminder = val;
					await this.plugin.saveSettings();
					if (val) this.plugin.startReminder();
					else this.plugin.stopReminder();
				}));

		new Setting(containerEl)
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
