var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SobrietyTrackerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  trackerFilePath: "sobriety-tracker.md",
  urgeTimerMinutes: 30,
  reminderTime: "20:30",
  enableReminder: true
};
var SobrietySettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("sobriety-settings");
    new import_obsidian.Setting(containerEl).setName("Tracker file path").setDesc("Path to the note where daily check-ins and urge logs are recorded (relative to vault root)").addText((text) => text.setPlaceholder("sobriety-tracker.md").setValue(this.plugin.settings.trackerFilePath).onChange(async (val) => {
      this.plugin.settings.trackerFilePath = val || "sobriety-tracker.md";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Urge timer duration").setDesc("How many minutes the urge timer should count down").addSlider((slider) => slider.setLimits(5, 120, 5).setValue(this.plugin.settings.urgeTimerMinutes).setDynamicTooltip().onChange(async (val) => {
      this.plugin.settings.urgeTimerMinutes = val;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Enable daily reminder").setDesc("Show a notification at the set time to prompt daily check-in").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableReminder).onChange(async (val) => {
      this.plugin.settings.enableReminder = val;
      await this.plugin.saveSettings();
      if (val) {
        this.plugin.startReminder();
      } else {
        this.plugin.stopReminder();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("Reminder time").setDesc("Time for the daily check-in reminder (24h format)").addText((text) => text.setPlaceholder("20:30").setValue(this.plugin.settings.reminderTime).onChange(async (val) => {
      if (/^\d{2}:\d{2}$/.test(val)) {
        this.plugin.settings.reminderTime = val;
        await this.plugin.saveSettings();
        if (this.plugin.settings.enableReminder) {
          this.plugin.startReminder();
        }
      }
    }));
  }
};

// src/urge-timer.ts
var import_obsidian2 = require("obsidian");
var UrgeTimer = class {
  constructor(plugin, app) {
    this.remainingSeconds = 0;
    this.totalSeconds = 0;
    this.intervalId = null;
    this.startTime = null;
    this.running = false;
    /** Callback when timer completes successfully */
    this.onVictory = null;
    /** Callback when timer is cancelled (relapse) */
    this.onRelapse = null;
    this.plugin = plugin;
    this.app = app;
    this.statusBarItem = plugin.addStatusBarItem();
    this.statusBarItem.addClass("plugin-sobriety-tracker");
    this.updateDisplay();
  }
  get isRunning() {
    return this.running;
  }
  get elapsedSeconds() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1e3);
  }
  start(durationMinutes) {
    if (this.running) {
      this.cancel();
    }
    this.totalSeconds = durationMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.startTime = /* @__PURE__ */ new Date();
    this.running = true;
    this.updateDisplay();
    this.intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime.getTime()) / 1e3);
      this.remainingSeconds = Math.max(0, this.totalSeconds - elapsed);
      this.updateDisplay();
      if (this.remainingSeconds <= 0) {
        this.complete();
      }
    }, 200);
    new Notification("\u{1F6E1}\uFE0F Urge Timer Started", {
      body: `Target: ${durationMinutes} minutes. Stay strong!`
    });
  }
  cancel() {
    if (!this.running) return;
    const elapsed = this.elapsedSeconds;
    this.stop();
    this.remainingSeconds = 0;
    this.updateDisplay();
    if (this.onRelapse) {
      this.onRelapse(elapsed);
    }
    new Notification("\u{1F494} Timer cancelled", {
      body: `You lasted ${Math.floor(elapsed / 60)} min ${elapsed % 60} sec. Keep trying!`
    });
  }
  complete() {
    this.stop();
    this.remainingSeconds = 0;
    this.updateDisplay();
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
      gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + 1);
      osc.stop(audioCtx.currentTime + 1);
    } catch (_) {
    }
    new Notification("\u{1F389} You did it!", {
      body: `You resisted the urge for ${Math.floor(this.totalSeconds / 60)} minutes!`
    });
    if (this.onVictory) {
      this.onVictory();
    }
  }
  stop() {
    this.running = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  updateDisplay() {
    if (!this.running || this.remainingSeconds <= 0) {
      this.statusBarItem.setText("");
      this.statusBarItem.style.display = "none";
      return;
    }
    const min = Math.floor(this.remainingSeconds / 60);
    const sec = this.remainingSeconds % 60;
    this.statusBarItem.setText(`\u{1F6E1}\uFE0F ${min}:${sec.toString().padStart(2, "0")}`);
    this.statusBarItem.style.display = "";
  }
  /**
   * Prompt the user to confirm relapse cancellation.
   * Returns true if user confirmed.
   */
  async confirmCancel() {
    return new Promise((resolve) => {
      const modal = new import_obsidian2.Modal(this.app);
      modal.titleEl.setText("\u{1F494} Confirm Relapse");
      const elapsed = this.elapsedSeconds;
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      const durationStr = elapsed > 0 ? `You lasted ${min}m ${sec}s so far.` : "";
      modal.contentEl.createEl("p", {
        text: `Are you sure you want to cancel? ${durationStr}`
      });
      const btnDiv = modal.contentEl.createDiv({
        attr: { style: "display: flex; gap: 12px; justify-content: center; margin-top: 20px;" }
      });
      new import_obsidian2.Setting(btnDiv).addButton(
        (btn) => btn.setButtonText("Yes, relapse").setCta().onClick(() => {
          modal.close();
          resolve(true);
        })
      );
      new import_obsidian2.Setting(btnDiv).addButton(
        (btn) => btn.setButtonText("No, keep going").onClick(() => {
          modal.close();
          resolve(false);
        })
      );
      modal.open();
    });
  }
  /**
   * Format elapsed time for logging.
   */
  formatElapsed(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} min ${sec} sec`;
  }
  unload() {
    this.stop();
    this.statusBarItem.remove();
  }
};

// src/tracker.ts
var import_obsidian3 = require("obsidian");
async function ensureTrackerFile(app, path) {
  const normalized = (0, import_obsidian3.normalizePath)(path);
  let file = app.vault.getAbstractFileByPath(normalized);
  if (file instanceof import_obsidian3.TFile) return file;
  const header = `# Sobriety Tracker

## Daily Check-ins

## Urge Log

`;
  file = await app.vault.create(normalized, header);
  return file;
}
async function logDailyCheckin(app, path, status, note = "") {
  const file = await ensureTrackerFile(app, path);
  const today = /* @__PURE__ */ new Date();
  const dateStr = formatDate(today);
  const entry = `- [${status === "success" ? "x" : " "}] ${dateStr}${note ? " \u2014 " + note : ""}
`;
  let content = await app.vault.read(file);
  const sectionMarker = "## Daily Check-ins";
  const insertPos = content.indexOf(sectionMarker);
  if (insertPos === -1) {
    content += `
## Daily Check-ins
${entry}`;
  } else {
    const afterSection = content.slice(insertPos + sectionMarker.length);
    const nextSection = afterSection.search(/\n## /);
    const insertAt = nextSection === -1 ? content.length : insertPos + sectionMarker.length + nextSection;
    content = content.slice(0, insertAt) + "\n" + entry + content.slice(insertAt);
  }
  await app.vault.modify(file, content);
}
async function logUrgeEvent(app, path, victory, durationMinutes, note = "") {
  const file = await ensureTrackerFile(app, path);
  const now = /* @__PURE__ */ new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);
  const weekday = formatWeekday(now);
  const entry = victory ? `- [x] ${dateStr} ${timeStr} \u2014 Urge resisted, stayed strong for ${durationMinutes} min \u2713
` : `- [ ] ${dateStr} ${timeStr} \u2014 Relapse${note ? " (" + note + ")" : ""} \u2717
`;
  let content = await app.vault.read(file);
  const sectionMarker = "## Urge Log";
  const insertPos = content.indexOf(sectionMarker);
  if (insertPos === -1) {
    content += `
## Urge Log
${entry}`;
  } else {
    const afterSection = content.slice(insertPos + sectionMarker.length);
    const nextSection = afterSection.search(/\n## /);
    const insertAt = nextSection === -1 ? content.length : insertPos + sectionMarker.length + nextSection;
    content = content.slice(0, insertAt) + "\n" + entry + content.slice(insertAt);
  }
  await app.vault.modify(file, content);
}
async function getStreak(app, path) {
  const file = app.vault.getAbstractFileByPath((0, import_obsidian3.normalizePath)(path));
  if (!(file instanceof import_obsidian3.TFile)) return 0;
  const content = await app.vault.read(file);
  const checkinMatch = content.match(/## Daily Check-ins\n([\s\S]*?)(?:\n## |$)/);
  if (!checkinMatch) return 0;
  const entries = checkinMatch[1].split("\n").map((l) => l.trim()).filter((l) => /^- \[([ x])\] /.test(l));
  if (entries.length === 0) return 0;
  let streak = 0;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = entries.length - 1; i >= 0; i--) {
    const match = entries[i].match(/^- \[([ x])\] (\d{4}-\d{2}-\d{2})/);
    if (!match) break;
    const isChecked = match[1] === "x";
    if (!isChecked) break;
    const entryDate = /* @__PURE__ */ new Date(match[2] + "T00:00:00");
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - (entries.length - 1 - i));
    streak++;
  }
  return streak;
}
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatWeekday(d) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[d.getDay()];
}
function pad(n) {
  return n.toString().padStart(2, "0");
}

// src/victory-modal.ts
var import_obsidian4 = require("obsidian");
var VictoryModal = class extends import_obsidian4.Modal {
  constructor(app, durationMinutes) {
    super(app);
    this.durationMinutes = durationMinutes;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("sobriety-victory-modal");
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    contentEl.createDiv({ cls: "badge", text: "\u{1F396}" });
    contentEl.createEl("h2", { text: "You Did It!" });
    contentEl.createDiv({ cls: "subtitle", text: "You resisted the urge" });
    contentEl.createDiv({ cls: "time-info", text: `${timeStr} \xB7 Stayed strong for ${this.durationMinutes} minutes` });
    const msg = contentEl.createDiv({ cls: "message" });
    msg.innerHTML = `
			Every resistance reshapes your brain.<br>
			You're not <strong>losing</strong> anything \u2014 you're <strong>winning</strong> yourself back.<br><br>
			The urge was just passing through. You are the one in control.
		`;
    const quote = contentEl.createDiv({ cls: "quote" });
    quote.innerHTML = `
			&ldquo;Between stimulus and response there is a space.<br>
			In that space is our power to choose our response.&rdquo;<br>
			&mdash; Viktor Frankl
		`;
    this.launchConfetti();
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  launchConfetti() {
    const colors = ["#f7d94e", "#f5a623", "#ff6b6b", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div");
      el.addClass("sobriety-confetti");
      el.style.left = Math.random() * 100 + "%";
      el.style.width = 6 + Math.random() * 8 + "px";
      el.style.height = 6 + Math.random() * 8 + "px";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      el.style.animationDuration = 2 + Math.random() * 3 + "s";
      el.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 6e3);
    }
  }
};
function pad2(n) {
  return n.toString().padStart(2, "0");
}

// src/main.ts
var SobrietyTrackerPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.reminderIntervalId = null;
  }
  async onload() {
    await this.loadSettings();
    this.urgeTimer = new UrgeTimer(this, this.app);
    this.urgeTimer.onVictory = () => {
      this.handleVictory();
    };
    this.urgeTimer.onRelapse = (durationSeconds) => {
      this.handleRelapse(durationSeconds);
    };
    this.addRibbonIcon("shield", "Start urge timer", () => {
      this.startUrgeTimer();
    });
    this.addCommand({
      id: "start-urge-timer",
      name: "Start urge timer",
      icon: "shield",
      callback: () => this.startUrgeTimer()
    });
    this.addCommand({
      id: "cancel-urge-timer",
      name: "Cancel urge timer (relapse)",
      icon: "x-circle",
      callback: async () => {
        if (!this.urgeTimer.isRunning) {
          new import_obsidian5.Notice("\u23F9 No timer running.");
          return;
        }
        const confirmed = await this.urgeTimer.confirmCancel();
        if (confirmed) {
          this.urgeTimer.cancel();
        }
      }
    });
    this.addCommand({
      id: "daily-checkin-success",
      name: "Daily check-in: Successful day",
      icon: "check-circle",
      callback: () => this.dailyCheckin("success")
    });
    this.addCommand({
      id: "daily-checkin-relapse",
      name: "Daily check-in: Relapse",
      icon: "x-circle",
      callback: () => this.dailyCheckin("relapse")
    });
    this.addCommand({
      id: "open-tracker-file",
      name: "Open tracker file",
      icon: "file-text",
      callback: () => this.openTrackerFile()
    });
    this.addCommand({
      id: "show-streak",
      name: "Show current streak",
      icon: "calendar",
      callback: () => this.showStreak()
    });
    this.addSettingTab(new SobrietySettingTab(this.app, this));
    if (this.settings.enableReminder) {
      this.startReminder();
    }
  }
  onunload() {
    this.stopReminder();
    this.urgeTimer.unload();
  }
  // ── Settings ──
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ── Urge timer ──
  startUrgeTimer() {
    this.urgeTimer.start(this.settings.urgeTimerMinutes);
  }
  async handleVictory() {
    try {
      await logUrgeEvent(this.app, this.settings.trackerFilePath, true, this.settings.urgeTimerMinutes);
    } catch (e) {
      console.error("Failed to log victory:", e);
    }
    new VictoryModal(this.app, this.settings.urgeTimerMinutes).open();
  }
  async handleRelapse(durationSeconds) {
    try {
      const durMin = Math.floor(durationSeconds / 60);
      await logUrgeEvent(this.app, this.settings.trackerFilePath, false, durMin);
    } catch (e) {
      console.error("Failed to log relapse:", e);
    }
  }
  // ── Daily check-in ──
  async dailyCheckin(status) {
    try {
      await logDailyCheckin(this.app, this.settings.trackerFilePath, status);
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new import_obsidian5.Notice(`\u2705 Check-in recorded! Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new import_obsidian5.Notice("\u274C Failed to record check-in. See console for details.");
      console.error("Check-in error:", e);
    }
  }
  // ── Streak display ──
  async showStreak() {
    try {
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new import_obsidian5.Notice(`\u{1F525} Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new import_obsidian5.Notice("\u274C Could not calculate streak.");
      console.error("Streak error:", e);
    }
  }
  // ── Open tracker file ──
  async openTrackerFile() {
    try {
      const file = await ensureTrackerFile(this.app, this.settings.trackerFilePath);
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    } catch (e) {
      console.error("Failed to open tracker file:", e);
    }
  }
  // ── Daily reminder ──
  startReminder() {
    this.stopReminder();
    const checkInterval = 60 * 1e3;
    this.reminderIntervalId = window.setInterval(() => {
      if (!this.settings.enableReminder) return;
      const now = /* @__PURE__ */ new Date();
      const currentMin = pad3(now.getHours()) + ":" + pad3(now.getMinutes());
      const currentSec = now.getSeconds();
      if (currentMin === this.settings.reminderTime && currentSec < 10) {
        new Notification("\u{1F514} Sobriety Check-in", {
          body: `Time for your daily check-in! How was today?`
        });
      }
    }, checkInterval);
  }
  stopReminder() {
    if (this.reminderIntervalId !== null) {
      window.clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = null;
    }
  }
};
function pad3(n) {
  return n.toString().padStart(2, "0");
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91cmdlLXRpbWVyLnRzIiwgInNyYy90cmFja2VyLnRzIiwgInNyYy92aWN0b3J5LW1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgU29icmlldHlTZXR0aW5ncywgU29icmlldHlTZXR0aW5nVGFiIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IFVyZ2VUaW1lciB9IGZyb20gXCIuL3VyZ2UtdGltZXJcIjtcbmltcG9ydCB7IGxvZ0RhaWx5Q2hlY2tpbiwgbG9nVXJnZUV2ZW50LCBlbnN1cmVUcmFja2VyRmlsZSwgZ2V0U3RyZWFrIH0gZnJvbSBcIi4vdHJhY2tlclwiO1xuaW1wb3J0IHsgVmljdG9yeU1vZGFsIH0gZnJvbSBcIi4vdmljdG9yeS1tb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTb2JyaWV0eVRyYWNrZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRzZXR0aW5ncyE6IFNvYnJpZXR5U2V0dGluZ3M7XG5cdHVyZ2VUaW1lciE6IFVyZ2VUaW1lcjtcblx0cHJpdmF0ZSByZW1pbmRlckludGVydmFsSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5cdGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB1cmdlIHRpbWVyXG5cdFx0dGhpcy51cmdlVGltZXIgPSBuZXcgVXJnZVRpbWVyKHRoaXMsIHRoaXMuYXBwKTtcblxuXHRcdC8vIFdpcmUgdGltZXIgY2FsbGJhY2tzXG5cdFx0dGhpcy51cmdlVGltZXIub25WaWN0b3J5ID0gKCkgPT4ge1xuXHRcdFx0dGhpcy5oYW5kbGVWaWN0b3J5KCk7XG5cdFx0fTtcblxuXHRcdHRoaXMudXJnZVRpbWVyLm9uUmVsYXBzZSA9IChkdXJhdGlvblNlY29uZHMpID0+IHtcblx0XHRcdHRoaXMuaGFuZGxlUmVsYXBzZShkdXJhdGlvblNlY29uZHMpO1xuXHRcdH07XG5cblx0XHQvLyBcdTI1MDBcdTI1MDAgUmliYm9uIGljb24gXHUyNTAwXHUyNTAwXG5cdFx0dGhpcy5hZGRSaWJib25JY29uKFwic2hpZWxkXCIsIFwiU3RhcnQgdXJnZSB0aW1lclwiLCAoKSA9PiB7XG5cdFx0XHR0aGlzLnN0YXJ0VXJnZVRpbWVyKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTI1MDBcdTI1MDAgQ29tbWFuZHMgXHUyNTAwXHUyNTAwXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcInN0YXJ0LXVyZ2UtdGltZXJcIixcblx0XHRcdG5hbWU6IFwiU3RhcnQgdXJnZSB0aW1lclwiLFxuXHRcdFx0aWNvbjogXCJzaGllbGRcIixcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLnN0YXJ0VXJnZVRpbWVyKCksXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6IFwiY2FuY2VsLXVyZ2UtdGltZXJcIixcblx0XHRcdG5hbWU6IFwiQ2FuY2VsIHVyZ2UgdGltZXIgKHJlbGFwc2UpXCIsXG5cdFx0XHRpY29uOiBcIngtY2lyY2xlXCIsXG5cdFx0XHRjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMudXJnZVRpbWVyLmlzUnVubmluZykge1xuXHRcdFx0XHRcdG5ldyBOb3RpY2UoXCJcdTIzRjkgTm8gdGltZXIgcnVubmluZy5cIik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMudXJnZVRpbWVyLmNvbmZpcm1DYW5jZWwoKTtcblx0XHRcdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0XHRcdHRoaXMudXJnZVRpbWVyLmNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcImRhaWx5LWNoZWNraW4tc3VjY2Vzc1wiLFxuXHRcdFx0bmFtZTogXCJEYWlseSBjaGVjay1pbjogU3VjY2Vzc2Z1bCBkYXlcIixcblx0XHRcdGljb246IFwiY2hlY2stY2lyY2xlXCIsXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5kYWlseUNoZWNraW4oXCJzdWNjZXNzXCIpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcImRhaWx5LWNoZWNraW4tcmVsYXBzZVwiLFxuXHRcdFx0bmFtZTogXCJEYWlseSBjaGVjay1pbjogUmVsYXBzZVwiLFxuXHRcdFx0aWNvbjogXCJ4LWNpcmNsZVwiLFxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHRoaXMuZGFpbHlDaGVja2luKFwicmVsYXBzZVwiKSxcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogXCJvcGVuLXRyYWNrZXItZmlsZVwiLFxuXHRcdFx0bmFtZTogXCJPcGVuIHRyYWNrZXIgZmlsZVwiLFxuXHRcdFx0aWNvbjogXCJmaWxlLXRleHRcIixcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5UcmFja2VyRmlsZSgpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcInNob3ctc3RyZWFrXCIsXG5cdFx0XHRuYW1lOiBcIlNob3cgY3VycmVudCBzdHJlYWtcIixcblx0XHRcdGljb246IFwiY2FsZW5kYXJcIixcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLnNob3dTdHJlYWsoKSxcblx0XHR9KTtcblxuXHRcdC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyB0YWIgXHUyNTAwXHUyNTAwXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTb2JyaWV0eVNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuXHRcdC8vIFx1MjUwMFx1MjUwMCBTdGFydCBkYWlseSByZW1pbmRlciBcdTI1MDBcdTI1MDBcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikge1xuXHRcdFx0dGhpcy5zdGFydFJlbWluZGVyKCk7XG5cdFx0fVxuXHR9XG5cblx0b251bmxvYWQoKTogdm9pZCB7XG5cdFx0dGhpcy5zdG9wUmVtaW5kZXIoKTtcblx0XHR0aGlzLnVyZ2VUaW1lci51bmxvYWQoKTtcblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcblxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG5cdH1cblxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBVcmdlIHRpbWVyIFx1MjUwMFx1MjUwMFxuXG5cdHByaXZhdGUgc3RhcnRVcmdlVGltZXIoKTogdm9pZCB7XG5cdFx0dGhpcy51cmdlVGltZXIuc3RhcnQodGhpcy5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlVmljdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgbG9nVXJnZUV2ZW50KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aCwgdHJ1ZSwgdGhpcy5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvZyB2aWN0b3J5OlwiLCBlKTtcblx0XHR9XG5cblx0XHQvLyBTaG93IHZpY3RvcnkgbW9kYWxcblx0XHRuZXcgVmljdG9yeU1vZGFsKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnVyZ2VUaW1lck1pbnV0ZXMpLm9wZW4oKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlUmVsYXBzZShkdXJhdGlvblNlY29uZHM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkdXJNaW4gPSBNYXRoLmZsb29yKGR1cmF0aW9uU2Vjb25kcyAvIDYwKTtcblx0XHRcdGF3YWl0IGxvZ1VyZ2VFdmVudCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy50cmFja2VyRmlsZVBhdGgsIGZhbHNlLCBkdXJNaW4pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gbG9nIHJlbGFwc2U6XCIsIGUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBEYWlseSBjaGVjay1pbiBcdTI1MDBcdTI1MDBcblxuXHRwcml2YXRlIGFzeW5jIGRhaWx5Q2hlY2tpbihzdGF0dXM6IFwic3VjY2Vzc1wiIHwgXCJyZWxhcHNlXCIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgbG9nRGFpbHlDaGVja2luKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aCwgc3RhdHVzKTtcblx0XHRcdGNvbnN0IHN0cmVhayA9IGF3YWl0IGdldFN0cmVhayh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy50cmFja2VyRmlsZVBhdGgpO1xuXHRcdFx0bmV3IE5vdGljZShgXHUyNzA1IENoZWNrLWluIHJlY29yZGVkISBDdXJyZW50IHN0cmVhazogJHtzdHJlYWt9IGRheSR7c3RyZWFrICE9PSAxID8gXCJzXCIgOiBcIlwifWApO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5ldyBOb3RpY2UoXCJcdTI3NEMgRmFpbGVkIHRvIHJlY29yZCBjaGVjay1pbi4gU2VlIGNvbnNvbGUgZm9yIGRldGFpbHMuXCIpO1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIkNoZWNrLWluIGVycm9yOlwiLCBlKTtcblx0XHR9XG5cdH1cblxuXHQvLyBcdTI1MDBcdTI1MDAgU3RyZWFrIGRpc3BsYXkgXHUyNTAwXHUyNTAwXG5cblx0cHJpdmF0ZSBhc3luYyBzaG93U3RyZWFrKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdHJlYWsgPSBhd2FpdCBnZXRTdHJlYWsodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoKTtcblx0XHRcdG5ldyBOb3RpY2UoYFx1RDgzRFx1REQyNSBDdXJyZW50IHN0cmVhazogJHtzdHJlYWt9IGRheSR7c3RyZWFrICE9PSAxID8gXCJzXCIgOiBcIlwifWApO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5ldyBOb3RpY2UoXCJcdTI3NEMgQ291bGQgbm90IGNhbGN1bGF0ZSBzdHJlYWsuXCIpO1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIlN0cmVhayBlcnJvcjpcIiwgZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHUyNTAwXHUyNTAwIE9wZW4gdHJhY2tlciBmaWxlIFx1MjUwMFx1MjUwMFxuXG5cdHByaXZhdGUgYXN5bmMgb3BlblRyYWNrZXJGaWxlKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZW5zdXJlVHJhY2tlckZpbGUodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoKTtcblx0XHRcdGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG5cdFx0XHRhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gb3BlbiB0cmFja2VyIGZpbGU6XCIsIGUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBEYWlseSByZW1pbmRlciBcdTI1MDBcdTI1MDBcblxuXHRzdGFydFJlbWluZGVyKCk6IHZvaWQge1xuXHRcdHRoaXMuc3RvcFJlbWluZGVyKCk7XG5cblx0XHRjb25zdCBjaGVja0ludGVydmFsID0gNjAgKiAxMDAwOyAvLyBDaGVjayBldmVyeSBtaW51dGVcblxuXHRcdHRoaXMucmVtaW5kZXJJbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc3QgY3VycmVudE1pbiA9IHBhZChub3cuZ2V0SG91cnMoKSkgKyBcIjpcIiArIHBhZChub3cuZ2V0TWludXRlcygpKTtcblx0XHRcdGNvbnN0IGN1cnJlbnRTZWMgPSBub3cuZ2V0U2Vjb25kcygpO1xuXG5cdFx0XHQvLyBGaXJlIHdpdGhpbiB0aGUgZmlyc3QgMTAgc2Vjb25kcyBvZiB0aGUgdGFyZ2V0IG1pbnV0ZVxuXHRcdFx0aWYgKGN1cnJlbnRNaW4gPT09IHRoaXMuc2V0dGluZ3MucmVtaW5kZXJUaW1lICYmIGN1cnJlbnRTZWMgPCAxMCkge1xuXHRcdFx0XHRuZXcgTm90aWZpY2F0aW9uKFwiXHVEODNEXHVERDE0IFNvYnJpZXR5IENoZWNrLWluXCIsIHtcblx0XHRcdFx0XHRib2R5OiBgVGltZSBmb3IgeW91ciBkYWlseSBjaGVjay1pbiEgSG93IHdhcyB0b2RheT9gLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9LCBjaGVja0ludGVydmFsKTtcblx0fVxuXG5cdHN0b3BSZW1pbmRlcigpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5yZW1pbmRlckludGVydmFsSWQgIT09IG51bGwpIHtcblx0XHRcdHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMucmVtaW5kZXJJbnRlcnZhbElkKTtcblx0XHRcdHRoaXMucmVtaW5kZXJJbnRlcnZhbElkID0gbnVsbDtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFkKG46IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiBuLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNvYnJpZXR5VHJhY2tlclBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU29icmlldHlTZXR0aW5ncyB7XG5cdC8qKiBQYXRoIHRvIHRoZSB0cmFja2VyIG5vdGUgKHJlbGF0aXZlIHRvIHZhdWx0IHJvb3QpICovXG5cdHRyYWNrZXJGaWxlUGF0aDogc3RyaW5nO1xuXHQvKiogVXJnZSB0aW1lciBkdXJhdGlvbiBpbiBtaW51dGVzICovXG5cdHVyZ2VUaW1lck1pbnV0ZXM6IG51bWJlcjtcblx0LyoqIERhaWx5IHJlbWluZGVyIHRpbWUgaW4gXCJISDpNTVwiIDI0aCBmb3JtYXQgKi9cblx0cmVtaW5kZXJUaW1lOiBzdHJpbmc7XG5cdC8qKiBFbmFibGUgZGFpbHkgcmVtaW5kZXIgKi9cblx0ZW5hYmxlUmVtaW5kZXI6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTb2JyaWV0eVNldHRpbmdzID0ge1xuXHR0cmFja2VyRmlsZVBhdGg6IFwic29icmlldHktdHJhY2tlci5tZFwiLFxuXHR1cmdlVGltZXJNaW51dGVzOiAzMCxcblx0cmVtaW5kZXJUaW1lOiBcIjIwOjMwXCIsXG5cdGVuYWJsZVJlbWluZGVyOiB0cnVlLFxufTtcblxuZXhwb3J0IGNsYXNzIFNvYnJpZXR5U2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuXHRwbHVnaW46IFNvYnJpZXR5VHJhY2tlclBsdWdpbjtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTb2JyaWV0eVRyYWNrZXJQbHVnaW4pIHtcblx0XHRzdXBlcihhcHAsIHBsdWdpbik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRkaXNwbGF5KCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblx0XHRjb250YWluZXJFbC5hZGRDbGFzcyhcInNvYnJpZXR5LXNldHRpbmdzXCIpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZShcIlRyYWNrZXIgZmlsZSBwYXRoXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlBhdGggdG8gdGhlIG5vdGUgd2hlcmUgZGFpbHkgY2hlY2staW5zIGFuZCB1cmdlIGxvZ3MgYXJlIHJlY29yZGVkIChyZWxhdGl2ZSB0byB2YXVsdCByb290KVwiKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcihcInNvYnJpZXR5LXRyYWNrZXIubWRcIilcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aClcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jIHZhbCA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoID0gdmFsIHx8IFwic29icmlldHktdHJhY2tlci5tZFwiO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKFwiVXJnZSB0aW1lciBkdXJhdGlvblwiKVxuXHRcdFx0LnNldERlc2MoXCJIb3cgbWFueSBtaW51dGVzIHRoZSB1cmdlIHRpbWVyIHNob3VsZCBjb3VudCBkb3duXCIpXG5cdFx0XHQuYWRkU2xpZGVyKHNsaWRlciA9PiBzbGlkZXJcblx0XHRcdFx0LnNldExpbWl0cyg1LCAxMjAsIDUpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKVxuXHRcdFx0XHQuc2V0RHluYW1pY1Rvb2x0aXAoKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzID0gdmFsO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKFwiRW5hYmxlIGRhaWx5IHJlbWluZGVyXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlNob3cgYSBub3RpZmljYXRpb24gYXQgdGhlIHNldCB0aW1lIHRvIHByb21wdCBkYWlseSBjaGVjay1pblwiKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jIHZhbCA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUmVtaW5kZXIgPSB2YWw7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0aWYgKHZhbCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc3RhcnRSZW1pbmRlcigpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zdG9wUmVtaW5kZXIoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoXCJSZW1pbmRlciB0aW1lXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlRpbWUgZm9yIHRoZSBkYWlseSBjaGVjay1pbiByZW1pbmRlciAoMjRoIGZvcm1hdClcIilcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoXCIyMDozMFwiKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtaW5kZXJUaW1lKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsID0+IHtcblx0XHRcdFx0XHRpZiAoL15cXGR7Mn06XFxkezJ9JC8udGVzdCh2YWwpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1pbmRlclRpbWUgPSB2YWw7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zdGFydFJlbWluZGVyKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBQbHVnaW4sIFNldHRpbmcsIFN0YXR1c0Jhckl0ZW0gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIFVyZ2VUaW1lciB7XG5cdHByaXZhdGUgcGx1Z2luOiBQbHVnaW47XG5cdHByaXZhdGUgYXBwOiBBcHA7XG5cdHByaXZhdGUgc3RhdHVzQmFySXRlbTogU3RhdHVzQmFySXRlbTtcblx0cHJpdmF0ZSByZW1haW5pbmdTZWNvbmRzOiBudW1iZXIgPSAwO1xuXHRwcml2YXRlIHRvdGFsU2Vjb25kczogbnVtYmVyID0gMDtcblx0cHJpdmF0ZSBpbnRlcnZhbElkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBzdGFydFRpbWU6IERhdGUgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2U7XG5cblx0LyoqIENhbGxiYWNrIHdoZW4gdGltZXIgY29tcGxldGVzIHN1Y2Nlc3NmdWxseSAqL1xuXHRvblZpY3Rvcnk6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXHQvKiogQ2FsbGJhY2sgd2hlbiB0aW1lciBpcyBjYW5jZWxsZWQgKHJlbGFwc2UpICovXG5cdG9uUmVsYXBzZTogKChkdXJhdGlvblNlY29uZHM6IG51bWJlcikgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuXHRjb25zdHJ1Y3RvcihwbHVnaW46IFBsdWdpbiwgYXBwOiBBcHApIHtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0XHR0aGlzLmFwcCA9IGFwcDtcblx0XHR0aGlzLnN0YXR1c0Jhckl0ZW0gPSBwbHVnaW4uYWRkU3RhdHVzQmFySXRlbSgpO1xuXHRcdHRoaXMuc3RhdHVzQmFySXRlbS5hZGRDbGFzcyhcInBsdWdpbi1zb2JyaWV0eS10cmFja2VyXCIpO1xuXHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXHR9XG5cblx0Z2V0IGlzUnVubmluZygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5ydW5uaW5nO1xuXHR9XG5cblx0Z2V0IGVsYXBzZWRTZWNvbmRzKCk6IG51bWJlciB7XG5cdFx0aWYgKCF0aGlzLnN0YXJ0VGltZSkgcmV0dXJuIDA7XG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoKERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZS5nZXRUaW1lKCkpIC8gMTAwMCk7XG5cdH1cblxuXHRzdGFydChkdXJhdGlvbk1pbnV0ZXM6IG51bWJlcik6IHZvaWQge1xuXHRcdGlmICh0aGlzLnJ1bm5pbmcpIHtcblx0XHRcdC8vIENvbmZpcm0gcmVzZXRcblx0XHRcdHRoaXMuY2FuY2VsKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy50b3RhbFNlY29uZHMgPSBkdXJhdGlvbk1pbnV0ZXMgKiA2MDtcblx0XHR0aGlzLnJlbWFpbmluZ1NlY29uZHMgPSB0aGlzLnRvdGFsU2Vjb25kcztcblx0XHR0aGlzLnN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcblx0XHR0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuXHRcdHRoaXMuaW50ZXJ2YWxJZCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRjb25zdCBlbGFwc2VkID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lIS5nZXRUaW1lKCkpIC8gMTAwMCk7XG5cdFx0XHR0aGlzLnJlbWFpbmluZ1NlY29uZHMgPSBNYXRoLm1heCgwLCB0aGlzLnRvdGFsU2Vjb25kcyAtIGVsYXBzZWQpO1xuXG5cdFx0XHR0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuXHRcdFx0aWYgKHRoaXMucmVtYWluaW5nU2Vjb25kcyA8PSAwKSB7XG5cdFx0XHRcdHRoaXMuY29tcGxldGUoKTtcblx0XHRcdH1cblx0XHR9LCAyMDApO1xuXG5cdFx0bmV3IE5vdGlmaWNhdGlvbihcIlx1RDgzRFx1REVFMVx1RkUwRiBVcmdlIFRpbWVyIFN0YXJ0ZWRcIiwge1xuXHRcdFx0Ym9keTogYFRhcmdldDogJHtkdXJhdGlvbk1pbnV0ZXN9IG1pbnV0ZXMuIFN0YXkgc3Ryb25nIWAsXG5cdFx0fSk7XG5cdH1cblxuXHRjYW5jZWwoKTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLnJ1bm5pbmcpIHJldHVybjtcblxuXHRcdGNvbnN0IGVsYXBzZWQgPSB0aGlzLmVsYXBzZWRTZWNvbmRzO1xuXHRcdHRoaXMuc3RvcCgpO1xuXHRcdHRoaXMucmVtYWluaW5nU2Vjb25kcyA9IDA7XG5cdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0XHRpZiAodGhpcy5vblJlbGFwc2UpIHtcblx0XHRcdHRoaXMub25SZWxhcHNlKGVsYXBzZWQpO1xuXHRcdH1cblxuXHRcdG5ldyBOb3RpZmljYXRpb24oXCJcdUQ4M0RcdURDOTQgVGltZXIgY2FuY2VsbGVkXCIsIHtcblx0XHRcdGJvZHk6IGBZb3UgbGFzdGVkICR7TWF0aC5mbG9vcihlbGFwc2VkIC8gNjApfSBtaW4gJHtlbGFwc2VkICUgNjB9IHNlYy4gS2VlcCB0cnlpbmchYCxcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgY29tcGxldGUoKTogdm9pZCB7XG5cdFx0dGhpcy5zdG9wKCk7XG5cdFx0dGhpcy5yZW1haW5pbmdTZWNvbmRzID0gMDtcblx0XHR0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuXHRcdC8vIFBsYXkgYSBzb3VuZCBpZiBwb3NzaWJsZVxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblx0XHRcdGNvbnN0IG9zYyA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblx0XHRcdGNvbnN0IGdhaW4gPSBhdWRpb0N0eC5jcmVhdGVHYWluKCk7XG5cdFx0XHRvc2MuY29ubmVjdChnYWluKTtcblx0XHRcdGdhaW4uY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cdFx0XHRvc2MuZnJlcXVlbmN5LnZhbHVlID0gODgwO1xuXHRcdFx0b3NjLnR5cGUgPSBcInNpbmVcIjtcblx0XHRcdGdhaW4uZ2Fpbi52YWx1ZSA9IDAuMztcblx0XHRcdG9zYy5zdGFydCgpO1xuXHRcdFx0Z2Fpbi5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDEsIGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgMSk7XG5cdFx0XHRvc2Muc3RvcChhdWRpb0N0eC5jdXJyZW50VGltZSArIDEpO1xuXHRcdH0gY2F0Y2ggKF8pIHtcblx0XHRcdC8vIEF1ZGlvIG5vdCBhdmFpbGFibGUsIHNpbGVudGx5IGNvbnRpbnVlXG5cdFx0fVxuXG5cdFx0bmV3IE5vdGlmaWNhdGlvbihcIlx1RDgzQ1x1REY4OSBZb3UgZGlkIGl0IVwiLCB7XG5cdFx0XHRib2R5OiBgWW91IHJlc2lzdGVkIHRoZSB1cmdlIGZvciAke01hdGguZmxvb3IodGhpcy50b3RhbFNlY29uZHMgLyA2MCl9IG1pbnV0ZXMhYCxcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLm9uVmljdG9yeSkge1xuXHRcdFx0dGhpcy5vblZpY3RvcnkoKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHN0b3AoKTogdm9pZCB7XG5cdFx0dGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMuaW50ZXJ2YWxJZCAhPT0gbnVsbCkge1xuXHRcdFx0d2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElkKTtcblx0XHRcdHRoaXMuaW50ZXJ2YWxJZCA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVEaXNwbGF5KCk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5ydW5uaW5nIHx8IHRoaXMucmVtYWluaW5nU2Vjb25kcyA8PSAwKSB7XG5cdFx0XHR0aGlzLnN0YXR1c0Jhckl0ZW0uc2V0VGV4dChcIlwiKTtcblx0XHRcdHRoaXMuc3RhdHVzQmFySXRlbS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWluID0gTWF0aC5mbG9vcih0aGlzLnJlbWFpbmluZ1NlY29uZHMgLyA2MCk7XG5cdFx0Y29uc3Qgc2VjID0gdGhpcy5yZW1haW5pbmdTZWNvbmRzICUgNjA7XG5cdFx0dGhpcy5zdGF0dXNCYXJJdGVtLnNldFRleHQoYFx1RDgzRFx1REVFMVx1RkUwRiAke21pbn06JHtzZWMudG9TdHJpbmcoKS5wYWRTdGFydCgyLCBcIjBcIil9YCk7XG5cdFx0dGhpcy5zdGF0dXNCYXJJdGVtLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXHR9XG5cblx0LyoqXG5cdCAqIFByb21wdCB0aGUgdXNlciB0byBjb25maXJtIHJlbGFwc2UgY2FuY2VsbGF0aW9uLlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgdXNlciBjb25maXJtZWQuXG5cdCAqL1xuXHRhc3luYyBjb25maXJtQ2FuY2VsKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgbW9kYWwgPSBuZXcgTW9kYWwodGhpcy5hcHApO1xuXHRcdFx0bW9kYWwudGl0bGVFbC5zZXRUZXh0KFwiXHVEODNEXHVEQzk0IENvbmZpcm0gUmVsYXBzZVwiKTtcblxuXHRcdFx0Y29uc3QgZWxhcHNlZCA9IHRoaXMuZWxhcHNlZFNlY29uZHM7XG5cdFx0XHRjb25zdCBtaW4gPSBNYXRoLmZsb29yKGVsYXBzZWQgLyA2MCk7XG5cdFx0XHRjb25zdCBzZWMgPSBlbGFwc2VkICUgNjA7XG5cdFx0XHRjb25zdCBkdXJhdGlvblN0ciA9IGVsYXBzZWQgPiAwID8gYFlvdSBsYXN0ZWQgJHttaW59bSAke3NlY31zIHNvIGZhci5gIDogXCJcIjtcblxuXHRcdFx0bW9kYWwuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG5cdFx0XHRcdHRleHQ6IGBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gY2FuY2VsPyAke2R1cmF0aW9uU3RyfWAsXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgYnRuRGl2ID0gbW9kYWwuY29udGVudEVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdGF0dHI6IHsgc3R5bGU6IFwiZGlzcGxheTogZmxleDsgZ2FwOiAxMnB4OyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgbWFyZ2luLXRvcDogMjBweDtcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdG5ldyBTZXR0aW5nKGJ0bkRpdilcblx0XHRcdFx0LmFkZEJ1dHRvbigoYnRuKSA9PlxuXHRcdFx0XHRcdGJ0blxuXHRcdFx0XHRcdFx0LnNldEJ1dHRvblRleHQoXCJZZXMsIHJlbGFwc2VcIilcblx0XHRcdFx0XHRcdC5zZXRDdGEoKVxuXHRcdFx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRtb2RhbC5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKHRydWUpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0KTtcblxuXHRcdFx0bmV3IFNldHRpbmcoYnRuRGl2KVxuXHRcdFx0XHQuYWRkQnV0dG9uKChidG4pID0+XG5cdFx0XHRcdFx0YnRuXG5cdFx0XHRcdFx0XHQuc2V0QnV0dG9uVGV4dChcIk5vLCBrZWVwIGdvaW5nXCIpXG5cdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdG1vZGFsLmNsb3NlKCk7XG5cdFx0XHRcdFx0XHRcdHJlc29sdmUoZmFsc2UpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0KTtcblxuXHRcdFx0bW9kYWwub3BlbigpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZvcm1hdCBlbGFwc2VkIHRpbWUgZm9yIGxvZ2dpbmcuXG5cdCAqL1xuXHRmb3JtYXRFbGFwc2VkKHNlY29uZHM6IG51bWJlcik6IHN0cmluZyB7XG5cdFx0Y29uc3QgbWluID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjApO1xuXHRcdGNvbnN0IHNlYyA9IHNlY29uZHMgJSA2MDtcblx0XHRyZXR1cm4gYCR7bWlufSBtaW4gJHtzZWN9IHNlY2A7XG5cdH1cblxuXHR1bmxvYWQoKTogdm9pZCB7XG5cdFx0dGhpcy5zdG9wKCk7XG5cdFx0dGhpcy5zdGF0dXNCYXJJdGVtLnJlbW92ZSgpO1xuXHR9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKipcbiAqIEVuc3VyZSB0aGUgdHJhY2tlciBmaWxlIGV4aXN0cywgY3JlYXRpbmcgaXQgd2l0aCBhIGhlYWRlciBpZiBub3QuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVUcmFja2VyRmlsZShhcHA6IEFwcCwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxURmlsZT4ge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwYXRoKTtcblx0bGV0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuXHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSByZXR1cm4gZmlsZTtcblxuXHQvLyBDcmVhdGUgbmV3IGZpbGUgd2l0aCBoZWFkZXJcblx0Y29uc3QgaGVhZGVyID0gYCMgU29icmlldHkgVHJhY2tlclxcblxcbiMjIERhaWx5IENoZWNrLWluc1xcblxcbiMjIFVyZ2UgTG9nXFxuXFxuYDtcblx0ZmlsZSA9IGF3YWl0IGFwcC52YXVsdC5jcmVhdGUobm9ybWFsaXplZCwgaGVhZGVyKTtcblx0cmV0dXJuIGZpbGUgYXMgVEZpbGU7XG59XG5cbi8qKlxuICogQXBwZW5kIGEgZGFpbHkgY2hlY2staW4gZW50cnkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2dEYWlseUNoZWNraW4oXG5cdGFwcDogQXBwLFxuXHRwYXRoOiBzdHJpbmcsXG5cdHN0YXR1czogXCJzdWNjZXNzXCIgfCBcInJlbGFwc2VcIixcblx0bm90ZTogc3RyaW5nID0gXCJcIlxuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGNvbnN0IGZpbGUgPSBhd2FpdCBlbnN1cmVUcmFja2VyRmlsZShhcHAsIHBhdGgpO1xuXHRjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG5cdGNvbnN0IGRhdGVTdHIgPSBmb3JtYXREYXRlKHRvZGF5KTtcblx0Y29uc3QgZW50cnkgPSBgLSBbJHtzdGF0dXMgPT09IFwic3VjY2Vzc1wiID8gXCJ4XCIgOiBcIiBcIn1dICR7ZGF0ZVN0cn0ke25vdGUgPyBcIiBcdTIwMTQgXCIgKyBub3RlIDogXCJcIn1cXG5gO1xuXG5cdGxldCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cdGNvbnN0IHNlY3Rpb25NYXJrZXIgPSBcIiMjIERhaWx5IENoZWNrLWluc1wiO1xuXG5cdGNvbnN0IGluc2VydFBvcyA9IGNvbnRlbnQuaW5kZXhPZihzZWN0aW9uTWFya2VyKTtcblx0aWYgKGluc2VydFBvcyA9PT0gLTEpIHtcblx0XHQvLyBTZWN0aW9uIG5vdCBmb3VuZCwgYXBwZW5kIHRvIGVuZFxuXHRcdGNvbnRlbnQgKz0gYFxcbiMjIERhaWx5IENoZWNrLWluc1xcbiR7ZW50cnl9YDtcblx0fSBlbHNlIHtcblx0XHQvLyBJbnNlcnQgYWZ0ZXIgdGhlIHNlY3Rpb24gaGVhZGluZywgYmVmb3JlIHRoZSBuZXh0IHNlY3Rpb24gb3IgZW5kXG5cdFx0Y29uc3QgYWZ0ZXJTZWN0aW9uID0gY29udGVudC5zbGljZShpbnNlcnRQb3MgKyBzZWN0aW9uTWFya2VyLmxlbmd0aCk7XG5cdFx0Y29uc3QgbmV4dFNlY3Rpb24gPSBhZnRlclNlY3Rpb24uc2VhcmNoKC9cXG4jIyAvKTtcblx0XHRjb25zdCBpbnNlcnRBdCA9IG5leHRTZWN0aW9uID09PSAtMVxuXHRcdFx0PyBjb250ZW50Lmxlbmd0aFxuXHRcdFx0OiBpbnNlcnRQb3MgKyBzZWN0aW9uTWFya2VyLmxlbmd0aCArIG5leHRTZWN0aW9uO1xuXHRcdGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKDAsIGluc2VydEF0KSArIFwiXFxuXCIgKyBlbnRyeSArIGNvbnRlbnQuc2xpY2UoaW5zZXJ0QXQpO1xuXHR9XG5cblx0YXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBjb250ZW50KTtcbn1cblxuLyoqXG4gKiBMb2cgYW4gdXJnZSBldmVudCAodmljdG9yeSBvciByZWxhcHNlKS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ1VyZ2VFdmVudChcblx0YXBwOiBBcHAsXG5cdHBhdGg6IHN0cmluZyxcblx0dmljdG9yeTogYm9vbGVhbixcblx0ZHVyYXRpb25NaW51dGVzOiBudW1iZXIsXG5cdG5vdGU6IHN0cmluZyA9IFwiXCJcbik6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBmaWxlID0gYXdhaXQgZW5zdXJlVHJhY2tlckZpbGUoYXBwLCBwYXRoKTtcblx0Y29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblx0Y29uc3QgZGF0ZVN0ciA9IGZvcm1hdERhdGUobm93KTtcblx0Y29uc3QgdGltZVN0ciA9IGZvcm1hdFRpbWUobm93KTtcblx0Y29uc3Qgd2Vla2RheSA9IGZvcm1hdFdlZWtkYXkobm93KTtcblxuXHRjb25zdCBlbnRyeSA9IHZpY3Rvcnlcblx0XHQ/IGAtIFt4XSAke2RhdGVTdHJ9ICR7dGltZVN0cn0gXHUyMDE0IFVyZ2UgcmVzaXN0ZWQsIHN0YXllZCBzdHJvbmcgZm9yICR7ZHVyYXRpb25NaW51dGVzfSBtaW4gXHUyNzEzXFxuYFxuXHRcdDogYC0gWyBdICR7ZGF0ZVN0cn0gJHt0aW1lU3RyfSBcdTIwMTQgUmVsYXBzZSR7bm90ZSA/IFwiIChcIiArIG5vdGUgKyBcIilcIiA6IFwiXCJ9IFx1MjcxN1xcbmA7XG5cblx0bGV0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblx0Y29uc3Qgc2VjdGlvbk1hcmtlciA9IFwiIyMgVXJnZSBMb2dcIjtcblxuXHRjb25zdCBpbnNlcnRQb3MgPSBjb250ZW50LmluZGV4T2Yoc2VjdGlvbk1hcmtlcik7XG5cdGlmIChpbnNlcnRQb3MgPT09IC0xKSB7XG5cdFx0Y29udGVudCArPSBgXFxuIyMgVXJnZSBMb2dcXG4ke2VudHJ5fWA7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgYWZ0ZXJTZWN0aW9uID0gY29udGVudC5zbGljZShpbnNlcnRQb3MgKyBzZWN0aW9uTWFya2VyLmxlbmd0aCk7XG5cdFx0Y29uc3QgbmV4dFNlY3Rpb24gPSBhZnRlclNlY3Rpb24uc2VhcmNoKC9cXG4jIyAvKTtcblx0XHRjb25zdCBpbnNlcnRBdCA9IG5leHRTZWN0aW9uID09PSAtMVxuXHRcdFx0PyBjb250ZW50Lmxlbmd0aFxuXHRcdFx0OiBpbnNlcnRQb3MgKyBzZWN0aW9uTWFya2VyLmxlbmd0aCArIG5leHRTZWN0aW9uO1xuXHRcdGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKDAsIGluc2VydEF0KSArIFwiXFxuXCIgKyBlbnRyeSArIGNvbnRlbnQuc2xpY2UoaW5zZXJ0QXQpO1xuXHR9XG5cblx0YXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBjb250ZW50KTtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgY3VycmVudCBzdHJlYWsgaW4gZGF5cyAoY29uc2VjdXRpdmUgc3VjY2Vzc2Z1bCBjaGVjay1pbnMpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3RyZWFrKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuXHRjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKHBhdGgpKTtcblx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIDA7XG5cblx0Y29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG5cdC8vIFBhcnNlIGRhaWx5IGNoZWNrLWlucyBzZWN0aW9uXG5cdGNvbnN0IGNoZWNraW5NYXRjaCA9IGNvbnRlbnQubWF0Y2goLyMjIERhaWx5IENoZWNrLWluc1xcbihbXFxzXFxTXSo/KSg/OlxcbiMjIHwkKS8pO1xuXHRpZiAoIWNoZWNraW5NYXRjaCkgcmV0dXJuIDA7XG5cblx0Y29uc3QgZW50cmllcyA9IGNoZWNraW5NYXRjaFsxXVxuXHRcdC5zcGxpdChcIlxcblwiKVxuXHRcdC5tYXAobCA9PiBsLnRyaW0oKSlcblx0XHQuZmlsdGVyKGwgPT4gL14tIFxcWyhbIHhdKVxcXSAvLnRlc3QobCkpO1xuXG5cdGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cblx0Ly8gV2FsayBiYWNrd2FyZHMgZnJvbSB0b2RheSBjb3VudGluZyBjb25zZWN1dGl2ZSBzdWNjZXNzZXNcblx0bGV0IHN0cmVhayA9IDA7XG5cdGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcblx0dG9kYXkuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG5cblx0Zm9yIChsZXQgaSA9IGVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRjb25zdCBtYXRjaCA9IGVudHJpZXNbaV0ubWF0Y2goL14tIFxcWyhbIHhdKVxcXSAoXFxkezR9LVxcZHsyfS1cXGR7Mn0pLyk7XG5cdFx0aWYgKCFtYXRjaCkgYnJlYWs7XG5cblx0XHRjb25zdCBpc0NoZWNrZWQgPSBtYXRjaFsxXSA9PT0gXCJ4XCI7XG5cdFx0aWYgKCFpc0NoZWNrZWQpIGJyZWFrOyAvLyBCcmVhayBzdHJlYWsgb24gZmlyc3QgdW5jaGVja2VkXG5cblx0XHRjb25zdCBlbnRyeURhdGUgPSBuZXcgRGF0ZShtYXRjaFsyXSArIFwiVDAwOjAwOjAwXCIpO1xuXHRcdGNvbnN0IGV4cGVjdGVkRGF0ZSA9IG5ldyBEYXRlKHRvZGF5KTtcblx0XHRleHBlY3RlZERhdGUuc2V0RGF0ZShleHBlY3RlZERhdGUuZ2V0RGF0ZSgpIC0gKGVudHJpZXMubGVuZ3RoIC0gMSAtIGkpKTtcblxuXHRcdC8vIEFsbG93IGVudHJpZXMgdG8gYmUgaW4gb3JkZXI7IGNvdW50IGNvbnNlY3V0aXZlIGNoZWNrZWQgaXRlbXNcblx0XHRzdHJlYWsrKztcblx0fVxuXG5cdHJldHVybiBzdHJlYWs7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZDogRGF0ZSk6IHN0cmluZyB7XG5cdHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7cGFkKGQuZ2V0TW9udGgoKSArIDEpfS0ke3BhZChkLmdldERhdGUoKSl9YDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VGltZShkOiBEYXRlKTogc3RyaW5nIHtcblx0cmV0dXJuIGAke3BhZChkLmdldEhvdXJzKCkpfToke3BhZChkLmdldE1pbnV0ZXMoKSl9YDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0V2Vla2RheShkOiBEYXRlKTogc3RyaW5nIHtcblx0Y29uc3QgZGF5cyA9IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXTtcblx0cmV0dXJuIGRheXNbZC5nZXREYXkoKV07XG59XG5cbmZ1bmN0aW9uIHBhZChuOiBudW1iZXIpOiBzdHJpbmcge1xuXHRyZXR1cm4gbi50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBWaWN0b3J5TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG5cdHByaXZhdGUgZHVyYXRpb25NaW51dGVzOiBudW1iZXI7XG5cblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIGR1cmF0aW9uTWludXRlczogbnVtYmVyKSB7XG5cdFx0c3VwZXIoYXBwKTtcblx0XHR0aGlzLmR1cmF0aW9uTWludXRlcyA9IGR1cmF0aW9uTWludXRlcztcblx0fVxuXG5cdG9uT3BlbigpOiB2b2lkIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuYWRkQ2xhc3MoXCJzb2JyaWV0eS12aWN0b3J5LW1vZGFsXCIpO1xuXG5cdFx0Y29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblx0XHRjb25zdCB0aW1lU3RyID0gYCR7bm93LmdldEZ1bGxZZWFyKCl9LSR7cGFkKG5vdy5nZXRNb250aCgpKzEpfS0ke3BhZChub3cuZ2V0RGF0ZSgpKX0gJHtwYWQobm93LmdldEhvdXJzKCkpfToke3BhZChub3cuZ2V0TWludXRlcygpKX1gO1xuXG5cdFx0Y29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJiYWRnZVwiLCB0ZXh0OiBcIlx1RDgzQ1x1REY5NlwiIH0pO1xuXHRcdGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJZb3UgRGlkIEl0IVwiIH0pO1xuXHRcdGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwic3VidGl0bGVcIiwgdGV4dDogXCJZb3UgcmVzaXN0ZWQgdGhlIHVyZ2VcIiB9KTtcblx0XHRjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInRpbWUtaW5mb1wiLCB0ZXh0OiBgJHt0aW1lU3RyfSBcdTAwQjcgU3RheWVkIHN0cm9uZyBmb3IgJHt0aGlzLmR1cmF0aW9uTWludXRlc30gbWludXRlc2AgfSk7XG5cblx0XHRjb25zdCBtc2cgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1lc3NhZ2VcIiB9KTtcblx0XHRtc2cuaW5uZXJIVE1MID0gYFxuXHRcdFx0RXZlcnkgcmVzaXN0YW5jZSByZXNoYXBlcyB5b3VyIGJyYWluLjxicj5cblx0XHRcdFlvdSdyZSBub3QgPHN0cm9uZz5sb3Npbmc8L3N0cm9uZz4gYW55dGhpbmcgXHUyMDE0IHlvdSdyZSA8c3Ryb25nPndpbm5pbmc8L3N0cm9uZz4geW91cnNlbGYgYmFjay48YnI+PGJyPlxuXHRcdFx0VGhlIHVyZ2Ugd2FzIGp1c3QgcGFzc2luZyB0aHJvdWdoLiBZb3UgYXJlIHRoZSBvbmUgaW4gY29udHJvbC5cblx0XHRgO1xuXG5cdFx0Y29uc3QgcXVvdGUgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInF1b3RlXCIgfSk7XG5cdFx0cXVvdGUuaW5uZXJIVE1MID0gYFxuXHRcdFx0JmxkcXVvO0JldHdlZW4gc3RpbXVsdXMgYW5kIHJlc3BvbnNlIHRoZXJlIGlzIGEgc3BhY2UuPGJyPlxuXHRcdFx0SW4gdGhhdCBzcGFjZSBpcyBvdXIgcG93ZXIgdG8gY2hvb3NlIG91ciByZXNwb25zZS4mcmRxdW87PGJyPlxuXHRcdFx0Jm1kYXNoOyBWaWt0b3IgRnJhbmtsXG5cdFx0YDtcblxuXHRcdC8vIExhdW5jaCBjb25mZXR0aVxuXHRcdHRoaXMubGF1bmNoQ29uZmV0dGkoKTtcblx0fVxuXG5cdG9uQ2xvc2UoKTogdm9pZCB7XG5cdFx0Y29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XG5cdH1cblxuXHRwcml2YXRlIGxhdW5jaENvbmZldHRpKCk6IHZvaWQge1xuXHRcdGNvbnN0IGNvbG9ycyA9IFtcIiNmN2Q5NGVcIiwgXCIjZjVhNjIzXCIsIFwiI2ZmNmI2YlwiLCBcIiM0OGRiZmJcIiwgXCIjZmY5ZmYzXCIsIFwiIzU0YTBmZlwiLCBcIiM1ZjI3Y2RcIl07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDYwOyBpKyspIHtcblx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdGVsLmFkZENsYXNzKFwic29icmlldHktY29uZmV0dGlcIik7XG5cdFx0XHRlbC5zdHlsZS5sZWZ0ID0gTWF0aC5yYW5kb20oKSAqIDEwMCArIFwiJVwiO1xuXHRcdFx0ZWwuc3R5bGUud2lkdGggPSAoNiArIE1hdGgucmFuZG9tKCkgKiA4KSArIFwicHhcIjtcblx0XHRcdGVsLnN0eWxlLmhlaWdodCA9ICg2ICsgTWF0aC5yYW5kb20oKSAqIDgpICsgXCJweFwiO1xuXHRcdFx0ZWwuc3R5bGUuYmFja2dyb3VuZCA9IGNvbG9yc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjb2xvcnMubGVuZ3RoKV07XG5cdFx0XHRlbC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBNYXRoLnJhbmRvbSgpID4gMC41ID8gXCI1MCVcIiA6IFwiMnB4XCI7XG5cdFx0XHRlbC5zdHlsZS5hbmltYXRpb25EdXJhdGlvbiA9ICgyICsgTWF0aC5yYW5kb20oKSAqIDMpICsgXCJzXCI7XG5cdFx0XHRlbC5zdHlsZS5hbmltYXRpb25EZWxheSA9IE1hdGgucmFuZG9tKCkgKiAyICsgXCJzXCI7XG5cblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuXG5cdFx0XHQvLyBSZW1vdmUgYWZ0ZXIgYW5pbWF0aW9uXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0aWYgKGVsLnBhcmVudE5vZGUpIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuXHRcdFx0fSwgNjAwMCk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHBhZChuOiBudW1iZXIpOiBzdHJpbmcge1xuXHRyZXR1cm4gbi50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQStCOzs7QUNBL0Isc0JBQStDO0FBY3hDLElBQU0sbUJBQXFDO0FBQUEsRUFDakQsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQUEsRUFDbEIsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQ2pCO0FBRU8sSUFBTSxxQkFBTixjQUFpQyxp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LElBQzFGLFNBQVMsR0FBRztBQUNYLFVBQUksd0JBQU8sNERBQXVEO0FBQ2xFLGNBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUFBLElBQ25DO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFJQSxNQUFjLGFBQTRCO0FBQ3pDLFFBQUk7QUFDSCxZQUFNLFNBQVMsTUFBTSxVQUFVLEtBQUssS0FBSyxLQUFLLFNBQVMsZUFBZTtBQUN0RSxVQUFJLHdCQUFPLDZCQUFzQixNQUFNLE9BQU8sV0FBVyxJQUFJLE1BQU0sRUFBRSxFQUFFO0FBQUEsSUFDeEUsU0FBUyxHQUFHO0FBQ1gsVUFBSSx3QkFBTyxvQ0FBK0I7QUFDMUMsY0FBUSxNQUFNLGlCQUFpQixDQUFDO0FBQUEsSUFDakM7QUFBQSxFQUNEO0FBQUE7QUFBQSxFQUlBLE1BQWMsa0JBQWlDO0FBQzlDLFFBQUk7QUFDSCxZQUFNLE9BQU8sTUFBTSxrQkFBa0IsS0FBSyxLQUFLLEtBQUssU0FBUyxlQUFlO0FBQzVFLFlBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDN0MsWUFBTSxLQUFLLFNBQVMsSUFBSTtBQUFBLElBQ3pCLFNBQVMsR0FBRztBQUNYLGNBQVEsTUFBTSxnQ0FBZ0MsQ0FBQztBQUFBLElBQ2hEO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFJQSxnQkFBc0I7QUFDckIsU0FBSyxhQUFhO0FBRWxCLFVBQU0sZ0JBQWdCLEtBQUs7QUFFM0IsU0FBSyxxQkFBcUIsT0FBTyxZQUFZLE1BQU07QUFDbEQsVUFBSSxDQUFDLEtBQUssU0FBUyxlQUFnQjtBQUVuQyxZQUFNLE1BQU0sb0JBQUksS0FBSztBQUNyQixZQUFNLGFBQWFDLEtBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxNQUFNQSxLQUFJLElBQUksV0FBVyxDQUFDO0FBQ25FLFlBQU0sYUFBYSxJQUFJLFdBQVc7QUFHbEMsVUFBSSxlQUFlLEtBQUssU0FBUyxnQkFBZ0IsYUFBYSxJQUFJO0FBQ2pFLFlBQUksYUFBYSwrQkFBd0I7QUFBQSxVQUN4QyxNQUFNO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsR0FBRyxhQUFhO0FBQUEsRUFDakI7QUFBQSxFQUVBLGVBQXFCO0FBQ3BCLFFBQUksS0FBSyx1QkFBdUIsTUFBTTtBQUNyQyxhQUFPLGNBQWMsS0FBSyxrQkFBa0I7QUFDNUMsV0FBSyxxQkFBcUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Q7QUFDRDtBQUVBLFNBQVNBLEtBQUksR0FBbUI7QUFDL0IsU0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUNwQzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInBhZCIsICJwYWQiXQp9Cg==
