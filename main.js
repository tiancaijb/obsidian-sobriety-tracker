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
var import_obsidian4 = require("obsidian");

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
var import_obsidian2 = require("obsidian");
async function ensureTrackerFile(app, path) {
  const normalized = (0, import_obsidian2.normalizePath)(path);
  let file = app.vault.getAbstractFileByPath(normalized);
  if (file instanceof import_obsidian2.TFile) return file;
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
  const file = app.vault.getAbstractFileByPath((0, import_obsidian2.normalizePath)(path));
  if (!(file instanceof import_obsidian2.TFile)) return 0;
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
var import_obsidian3 = require("obsidian");
var VictoryModal = class extends import_obsidian3.Modal {
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
var SobrietyTrackerPlugin = class extends import_obsidian4.Plugin {
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
      callback: () => this.urgeTimer.cancel()
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
      new Notice(`\u2705 Check-in recorded! Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new Notice("\u274C Failed to record check-in. See console for details.");
      console.error("Check-in error:", e);
    }
  }
  // ── Streak display ──
  async showStreak() {
    try {
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new Notice(`\u{1F525} Current streak: ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new Notice("\u274C Could not calculate streak.");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91cmdlLXRpbWVyLnRzIiwgInNyYy90cmFja2VyLnRzIiwgInNyYy92aWN0b3J5LW1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIFNvYnJpZXR5U2V0dGluZ3MsIFNvYnJpZXR5U2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBVcmdlVGltZXIgfSBmcm9tIFwiLi91cmdlLXRpbWVyXCI7XG5pbXBvcnQgeyBsb2dEYWlseUNoZWNraW4sIGxvZ1VyZ2VFdmVudCwgZW5zdXJlVHJhY2tlckZpbGUsIGdldFN0cmVhayB9IGZyb20gXCIuL3RyYWNrZXJcIjtcbmltcG9ydCB7IFZpY3RvcnlNb2RhbCB9IGZyb20gXCIuL3ZpY3RvcnktbW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU29icmlldHlUcmFja2VyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0c2V0dGluZ3MhOiBTb2JyaWV0eVNldHRpbmdzO1xuXHR1cmdlVGltZXIhOiBVcmdlVGltZXI7XG5cdHByaXZhdGUgcmVtaW5kZXJJbnRlcnZhbElkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuXHRhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuXHRcdC8vIEluaXRpYWxpemUgdXJnZSB0aW1lclxuXHRcdHRoaXMudXJnZVRpbWVyID0gbmV3IFVyZ2VUaW1lcih0aGlzLCB0aGlzLmFwcCk7XG5cblx0XHQvLyBXaXJlIHRpbWVyIGNhbGxiYWNrc1xuXHRcdHRoaXMudXJnZVRpbWVyLm9uVmljdG9yeSA9ICgpID0+IHtcblx0XHRcdHRoaXMuaGFuZGxlVmljdG9yeSgpO1xuXHRcdH07XG5cblx0XHR0aGlzLnVyZ2VUaW1lci5vblJlbGFwc2UgPSAoZHVyYXRpb25TZWNvbmRzKSA9PiB7XG5cdFx0XHR0aGlzLmhhbmRsZVJlbGFwc2UoZHVyYXRpb25TZWNvbmRzKTtcblx0XHR9O1xuXG5cdFx0Ly8gXHUyNTAwXHUyNTAwIFJpYmJvbiBpY29uIFx1MjUwMFx1MjUwMFxuXHRcdHRoaXMuYWRkUmliYm9uSWNvbihcInNoaWVsZFwiLCBcIlN0YXJ0IHVyZ2UgdGltZXJcIiwgKCkgPT4ge1xuXHRcdFx0dGhpcy5zdGFydFVyZ2VUaW1lcigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHUyNTAwXHUyNTAwIENvbW1hbmRzIFx1MjUwMFx1MjUwMFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogXCJzdGFydC11cmdlLXRpbWVyXCIsXG5cdFx0XHRuYW1lOiBcIlN0YXJ0IHVyZ2UgdGltZXJcIixcblx0XHRcdGljb246IFwic2hpZWxkXCIsXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5zdGFydFVyZ2VUaW1lcigpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcImNhbmNlbC11cmdlLXRpbWVyXCIsXG5cdFx0XHRuYW1lOiBcIkNhbmNlbCB1cmdlIHRpbWVyIChyZWxhcHNlKVwiLFxuXHRcdFx0aWNvbjogXCJ4LWNpcmNsZVwiLFxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHRoaXMudXJnZVRpbWVyLmNhbmNlbCgpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcImRhaWx5LWNoZWNraW4tc3VjY2Vzc1wiLFxuXHRcdFx0bmFtZTogXCJEYWlseSBjaGVjay1pbjogU3VjY2Vzc2Z1bCBkYXlcIixcblx0XHRcdGljb246IFwiY2hlY2stY2lyY2xlXCIsXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5kYWlseUNoZWNraW4oXCJzdWNjZXNzXCIpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcImRhaWx5LWNoZWNraW4tcmVsYXBzZVwiLFxuXHRcdFx0bmFtZTogXCJEYWlseSBjaGVjay1pbjogUmVsYXBzZVwiLFxuXHRcdFx0aWNvbjogXCJ4LWNpcmNsZVwiLFxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHRoaXMuZGFpbHlDaGVja2luKFwicmVsYXBzZVwiKSxcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogXCJvcGVuLXRyYWNrZXItZmlsZVwiLFxuXHRcdFx0bmFtZTogXCJPcGVuIHRyYWNrZXIgZmlsZVwiLFxuXHRcdFx0aWNvbjogXCJmaWxlLXRleHRcIixcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5UcmFja2VyRmlsZSgpLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiBcInNob3ctc3RyZWFrXCIsXG5cdFx0XHRuYW1lOiBcIlNob3cgY3VycmVudCBzdHJlYWtcIixcblx0XHRcdGljb246IFwiY2FsZW5kYXJcIixcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLnNob3dTdHJlYWsoKSxcblx0XHR9KTtcblxuXHRcdC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyB0YWIgXHUyNTAwXHUyNTAwXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTb2JyaWV0eVNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuXHRcdC8vIFx1MjUwMFx1MjUwMCBTdGFydCBkYWlseSByZW1pbmRlciBcdTI1MDBcdTI1MDBcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikge1xuXHRcdFx0dGhpcy5zdGFydFJlbWluZGVyKCk7XG5cdFx0fVxuXHR9XG5cblx0b251bmxvYWQoKTogdm9pZCB7XG5cdFx0dGhpcy5zdG9wUmVtaW5kZXIoKTtcblx0XHR0aGlzLnVyZ2VUaW1lci51bmxvYWQoKTtcblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcblxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG5cdH1cblxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBVcmdlIHRpbWVyIFx1MjUwMFx1MjUwMFxuXG5cdHByaXZhdGUgc3RhcnRVcmdlVGltZXIoKTogdm9pZCB7XG5cdFx0dGhpcy51cmdlVGltZXIuc3RhcnQodGhpcy5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlVmljdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgbG9nVXJnZUV2ZW50KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aCwgdHJ1ZSwgdGhpcy5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvZyB2aWN0b3J5OlwiLCBlKTtcblx0XHR9XG5cblx0XHQvLyBTaG93IHZpY3RvcnkgbW9kYWxcblx0XHRuZXcgVmljdG9yeU1vZGFsKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnVyZ2VUaW1lck1pbnV0ZXMpLm9wZW4oKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlUmVsYXBzZShkdXJhdGlvblNlY29uZHM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkdXJNaW4gPSBNYXRoLmZsb29yKGR1cmF0aW9uU2Vjb25kcyAvIDYwKTtcblx0XHRcdGF3YWl0IGxvZ1VyZ2VFdmVudCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy50cmFja2VyRmlsZVBhdGgsIGZhbHNlLCBkdXJNaW4pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gbG9nIHJlbGFwc2U6XCIsIGUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBEYWlseSBjaGVjay1pbiBcdTI1MDBcdTI1MDBcblxuXHRwcml2YXRlIGFzeW5jIGRhaWx5Q2hlY2tpbihzdGF0dXM6IFwic3VjY2Vzc1wiIHwgXCJyZWxhcHNlXCIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgbG9nRGFpbHlDaGVja2luKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aCwgc3RhdHVzKTtcblx0XHRcdGNvbnN0IHN0cmVhayA9IGF3YWl0IGdldFN0cmVhayh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy50cmFja2VyRmlsZVBhdGgpO1xuXHRcdFx0bmV3IE5vdGljZShgXHUyNzA1IENoZWNrLWluIHJlY29yZGVkISBDdXJyZW50IHN0cmVhazogJHtzdHJlYWt9IGRheSR7c3RyZWFrICE9PSAxID8gXCJzXCIgOiBcIlwifWApO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5ldyBOb3RpY2UoXCJcdTI3NEMgRmFpbGVkIHRvIHJlY29yZCBjaGVjay1pbi4gU2VlIGNvbnNvbGUgZm9yIGRldGFpbHMuXCIpO1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIkNoZWNrLWluIGVycm9yOlwiLCBlKTtcblx0XHR9XG5cdH1cblxuXHQvLyBcdTI1MDBcdTI1MDAgU3RyZWFrIGRpc3BsYXkgXHUyNTAwXHUyNTAwXG5cblx0cHJpdmF0ZSBhc3luYyBzaG93U3RyZWFrKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdHJlYWsgPSBhd2FpdCBnZXRTdHJlYWsodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoKTtcblx0XHRcdG5ldyBOb3RpY2UoYFx1RDgzRFx1REQyNSBDdXJyZW50IHN0cmVhazogJHtzdHJlYWt9IGRheSR7c3RyZWFrICE9PSAxID8gXCJzXCIgOiBcIlwifWApO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5ldyBOb3RpY2UoXCJcdTI3NEMgQ291bGQgbm90IGNhbGN1bGF0ZSBzdHJlYWsuXCIpO1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIlN0cmVhayBlcnJvcjpcIiwgZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHUyNTAwXHUyNTAwIE9wZW4gdHJhY2tlciBmaWxlIFx1MjUwMFx1MjUwMFxuXG5cdHByaXZhdGUgYXN5bmMgb3BlblRyYWNrZXJGaWxlKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZW5zdXJlVHJhY2tlckZpbGUodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoKTtcblx0XHRcdGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG5cdFx0XHRhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gb3BlbiB0cmFja2VyIGZpbGU6XCIsIGUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1MjUwMFx1MjUwMCBEYWlseSByZW1pbmRlciBcdTI1MDBcdTI1MDBcblxuXHRzdGFydFJlbWluZGVyKCk6IHZvaWQge1xuXHRcdHRoaXMuc3RvcFJlbWluZGVyKCk7XG5cblx0XHRjb25zdCBjaGVja0ludGVydmFsID0gNjAgKiAxMDAwOyAvLyBDaGVjayBldmVyeSBtaW51dGVcblxuXHRcdHRoaXMucmVtaW5kZXJJbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc3QgY3VycmVudE1pbiA9IHBhZChub3cuZ2V0SG91cnMoKSkgKyBcIjpcIiArIHBhZChub3cuZ2V0TWludXRlcygpKTtcblx0XHRcdGNvbnN0IGN1cnJlbnRTZWMgPSBub3cuZ2V0U2Vjb25kcygpO1xuXG5cdFx0XHQvLyBGaXJlIHdpdGhpbiB0aGUgZmlyc3QgMTAgc2Vjb25kcyBvZiB0aGUgdGFyZ2V0IG1pbnV0ZVxuXHRcdFx0aWYgKGN1cnJlbnRNaW4gPT09IHRoaXMuc2V0dGluZ3MucmVtaW5kZXJUaW1lICYmIGN1cnJlbnRTZWMgPCAxMCkge1xuXHRcdFx0XHRuZXcgTm90aWZpY2F0aW9uKFwiXHVEODNEXHVERDE0IFNvYnJpZXR5IENoZWNrLWluXCIsIHtcblx0XHRcdFx0XHRib2R5OiBgVGltZSBmb3IgeW91ciBkYWlseSBjaGVjay1pbiEgSG93IHdhcyB0b2RheT9gLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9LCBjaGVja0ludGVydmFsKTtcblx0fVxuXG5cdHN0b3BSZW1pbmRlcigpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5yZW1pbmRlckludGVydmFsSWQgIT09IG51bGwpIHtcblx0XHRcdHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMucmVtaW5kZXJJbnRlcnZhbElkKTtcblx0XHRcdHRoaXMucmVtaW5kZXJJbnRlcnZhbElkID0gbnVsbDtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFkKG46IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiBuLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IFNvYnJpZXR5VHJhY2tlclBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU29icmlldHlTZXR0aW5ncyB7XG5cdC8qKiBQYXRoIHRvIHRoZSB0cmFja2VyIG5vdGUgKHJlbGF0aXZlIHRvIHZhdWx0IHJvb3QpICovXG5cdHRyYWNrZXJGaWxlUGF0aDogc3RyaW5nO1xuXHQvKiogVXJnZSB0aW1lciBkdXJhdGlvbiBpbiBtaW51dGVzICovXG5cdHVyZ2VUaW1lck1pbnV0ZXM6IG51bWJlcjtcblx0LyoqIERhaWx5IHJlbWluZGVyIHRpbWUgaW4gXCJISDpNTVwiIDI0aCBmb3JtYXQgKi9cblx0cmVtaW5kZXJUaW1lOiBzdHJpbmc7XG5cdC8qKiBFbmFibGUgZGFpbHkgcmVtaW5kZXIgKi9cblx0ZW5hYmxlUmVtaW5kZXI6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTb2JyaWV0eVNldHRpbmdzID0ge1xuXHR0cmFja2VyRmlsZVBhdGg6IFwic29icmlldHktdHJhY2tlci5tZFwiLFxuXHR1cmdlVGltZXJNaW51dGVzOiAzMCxcblx0cmVtaW5kZXJUaW1lOiBcIjIwOjMwXCIsXG5cdGVuYWJsZVJlbWluZGVyOiB0cnVlLFxufTtcblxuZXhwb3J0IGNsYXNzIFNvYnJpZXR5U2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuXHRwbHVnaW46IFNvYnJpZXR5VHJhY2tlclBsdWdpbjtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTb2JyaWV0eVRyYWNrZXJQbHVnaW4pIHtcblx0XHRzdXBlcihhcHAsIHBsdWdpbik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRkaXNwbGF5KCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblx0XHRjb250YWluZXJFbC5hZGRDbGFzcyhcInNvYnJpZXR5LXNldHRpbmdzXCIpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZShcIlRyYWNrZXIgZmlsZSBwYXRoXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlBhdGggdG8gdGhlIG5vdGUgd2hlcmUgZGFpbHkgY2hlY2staW5zIGFuZCB1cmdlIGxvZ3MgYXJlIHJlY29yZGVkIChyZWxhdGl2ZSB0byB2YXVsdCByb290KVwiKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcihcInNvYnJpZXR5LXRyYWNrZXIubWRcIilcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYWNrZXJGaWxlUGF0aClcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jIHZhbCA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhY2tlckZpbGVQYXRoID0gdmFsIHx8IFwic29icmlldHktdHJhY2tlci5tZFwiO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKFwiVXJnZSB0aW1lciBkdXJhdGlvblwiKVxuXHRcdFx0LnNldERlc2MoXCJIb3cgbWFueSBtaW51dGVzIHRoZSB1cmdlIHRpbWVyIHNob3VsZCBjb3VudCBkb3duXCIpXG5cdFx0XHQuYWRkU2xpZGVyKHNsaWRlciA9PiBzbGlkZXJcblx0XHRcdFx0LnNldExpbWl0cyg1LCAxMjAsIDUpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzKVxuXHRcdFx0XHQuc2V0RHluYW1pY1Rvb2x0aXAoKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy51cmdlVGltZXJNaW51dGVzID0gdmFsO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKFwiRW5hYmxlIGRhaWx5IHJlbWluZGVyXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlNob3cgYSBub3RpZmljYXRpb24gYXQgdGhlIHNldCB0aW1lIHRvIHByb21wdCBkYWlseSBjaGVjay1pblwiKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jIHZhbCA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUmVtaW5kZXIgPSB2YWw7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0aWYgKHZhbCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc3RhcnRSZW1pbmRlcigpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zdG9wUmVtaW5kZXIoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUoXCJSZW1pbmRlciB0aW1lXCIpXG5cdFx0XHQuc2V0RGVzYyhcIlRpbWUgZm9yIHRoZSBkYWlseSBjaGVjay1pbiByZW1pbmRlciAoMjRoIGZvcm1hdClcIilcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoXCIyMDozMFwiKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtaW5kZXJUaW1lKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgdmFsID0+IHtcblx0XHRcdFx0XHRpZiAoL15cXGR7Mn06XFxkezJ9JC8udGVzdCh2YWwpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1pbmRlclRpbWUgPSB2YWw7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVSZW1pbmRlcikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zdGFydFJlbWluZGVyKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpbiwgU3RhdHVzQmFySXRlbSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgVXJnZVRpbWVyIHtcblx0cHJpdmF0ZSBwbHVnaW46IFBsdWdpbjtcblx0cHJpdmF0ZSBhcHA6IEFwcDtcblx0cHJpdmF0ZSBzdGF0dXNCYXJJdGVtOiBTdGF0dXNCYXJJdGVtO1xuXHRwcml2YXRlIHJlbWFpbmluZ1NlY29uZHM6IG51bWJlciA9IDA7XG5cdHByaXZhdGUgdG90YWxTZWNvbmRzOiBudW1iZXIgPSAwO1xuXHRwcml2YXRlIGludGVydmFsSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXJ0VGltZTogRGF0ZSB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHQvKiogQ2FsbGJhY2sgd2hlbiB0aW1lciBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5ICovXG5cdG9uVmljdG9yeTogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cdC8qKiBDYWxsYmFjayB3aGVuIHRpbWVyIGlzIGNhbmNlbGxlZCAocmVsYXBzZSkgKi9cblx0b25SZWxhcHNlOiAoKGR1cmF0aW9uU2Vjb25kczogbnVtYmVyKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG5cdGNvbnN0cnVjdG9yKHBsdWdpbjogUGx1Z2luLCBhcHA6IEFwcCkge1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHRcdHRoaXMuYXBwID0gYXBwO1xuXHRcdHRoaXMuc3RhdHVzQmFySXRlbSA9IHBsdWdpbi5hZGRTdGF0dXNCYXJJdGVtKCk7XG5cdFx0dGhpcy5zdGF0dXNCYXJJdGVtLmFkZENsYXNzKFwicGx1Z2luLXNvYnJpZXR5LXRyYWNrZXJcIik7XG5cdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cdH1cblxuXHRnZXQgaXNSdW5uaW5nKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnJ1bm5pbmc7XG5cdH1cblxuXHRnZXQgZWxhcHNlZFNlY29uZHMoKTogbnVtYmVyIHtcblx0XHRpZiAoIXRoaXMuc3RhcnRUaW1lKSByZXR1cm4gMDtcblx0XHRyZXR1cm4gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lLmdldFRpbWUoKSkgLyAxMDAwKTtcblx0fVxuXG5cdHN0YXJ0KGR1cmF0aW9uTWludXRlczogbnVtYmVyKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMucnVubmluZykge1xuXHRcdFx0Ly8gQ29uZmlybSByZXNldFxuXHRcdFx0dGhpcy5jYW5jZWwoKTtcblx0XHR9XG5cblx0XHR0aGlzLnRvdGFsU2Vjb25kcyA9IGR1cmF0aW9uTWludXRlcyAqIDYwO1xuXHRcdHRoaXMucmVtYWluaW5nU2Vjb25kcyA9IHRoaXMudG90YWxTZWNvbmRzO1xuXHRcdHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblx0XHR0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdFx0dGhpcy5pbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IGVsYXBzZWQgPSBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gdGhpcy5zdGFydFRpbWUhLmdldFRpbWUoKSkgLyAxMDAwKTtcblx0XHRcdHRoaXMucmVtYWluaW5nU2Vjb25kcyA9IE1hdGgubWF4KDAsIHRoaXMudG90YWxTZWNvbmRzIC0gZWxhcHNlZCk7XG5cblx0XHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdFx0XHRpZiAodGhpcy5yZW1haW5pbmdTZWNvbmRzIDw9IDApIHtcblx0XHRcdFx0dGhpcy5jb21wbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0sIDIwMCk7XG5cblx0XHRuZXcgTm90aWZpY2F0aW9uKFwiXHVEODNEXHVERUUxXHVGRTBGIFVyZ2UgVGltZXIgU3RhcnRlZFwiLCB7XG5cdFx0XHRib2R5OiBgVGFyZ2V0OiAke2R1cmF0aW9uTWludXRlc30gbWludXRlcy4gU3RheSBzdHJvbmchYCxcblx0XHR9KTtcblx0fVxuXG5cdGNhbmNlbCgpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMucnVubmluZykgcmV0dXJuO1xuXG5cdFx0Y29uc3QgZWxhcHNlZCA9IHRoaXMuZWxhcHNlZFNlY29uZHM7XG5cdFx0dGhpcy5zdG9wKCk7XG5cdFx0dGhpcy5yZW1haW5pbmdTZWNvbmRzID0gMDtcblx0XHR0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuXHRcdGlmICh0aGlzLm9uUmVsYXBzZSkge1xuXHRcdFx0dGhpcy5vblJlbGFwc2UoZWxhcHNlZCk7XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGlmaWNhdGlvbihcIlx1RDgzRFx1REM5NCBUaW1lciBjYW5jZWxsZWRcIiwge1xuXHRcdFx0Ym9keTogYFlvdSBsYXN0ZWQgJHtNYXRoLmZsb29yKGVsYXBzZWQgLyA2MCl9IG1pbiAke2VsYXBzZWQgJSA2MH0gc2VjLiBLZWVwIHRyeWluZyFgLFxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjb21wbGV0ZSgpOiB2b2lkIHtcblx0XHR0aGlzLnN0b3AoKTtcblx0XHR0aGlzLnJlbWFpbmluZ1NlY29uZHMgPSAwO1xuXHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdFx0Ly8gUGxheSBhIHNvdW5kIGlmIHBvc3NpYmxlXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXHRcdFx0Y29uc3Qgb3NjID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuXHRcdFx0Y29uc3QgZ2FpbiA9IGF1ZGlvQ3R4LmNyZWF0ZUdhaW4oKTtcblx0XHRcdG9zYy5jb25uZWN0KGdhaW4pO1xuXHRcdFx0Z2Fpbi5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblx0XHRcdG9zYy5mcmVxdWVuY3kudmFsdWUgPSA4ODA7XG5cdFx0XHRvc2MudHlwZSA9IFwic2luZVwiO1xuXHRcdFx0Z2Fpbi5nYWluLnZhbHVlID0gMC4zO1xuXHRcdFx0b3NjLnN0YXJ0KCk7XG5cdFx0XHRnYWluLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMSwgYXVkaW9DdHguY3VycmVudFRpbWUgKyAxKTtcblx0XHRcdG9zYy5zdG9wKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgMSk7XG5cdFx0fSBjYXRjaCAoXykge1xuXHRcdFx0Ly8gQXVkaW8gbm90IGF2YWlsYWJsZSwgc2lsZW50bHkgY29udGludWVcblx0XHR9XG5cblx0XHRuZXcgTm90aWZpY2F0aW9uKFwiXHVEODNDXHVERjg5IFlvdSBkaWQgaXQhXCIsIHtcblx0XHRcdGJvZHk6IGBZb3UgcmVzaXN0ZWQgdGhlIHVyZ2UgZm9yICR7TWF0aC5mbG9vcih0aGlzLnRvdGFsU2Vjb25kcyAvIDYwKX0gbWludXRlcyFgLFxuXHRcdH0pO1xuXG5cdFx0aWYgKHRoaXMub25WaWN0b3J5KSB7XG5cdFx0XHR0aGlzLm9uVmljdG9yeSgpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc3RvcCgpOiB2b2lkIHtcblx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5pbnRlcnZhbElkICE9PSBudWxsKSB7XG5cdFx0XHR3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSWQpO1xuXHRcdFx0dGhpcy5pbnRlcnZhbElkID0gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZURpc3BsYXkoKTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLnJ1bm5pbmcgfHwgdGhpcy5yZW1haW5pbmdTZWNvbmRzIDw9IDApIHtcblx0XHRcdHRoaXMuc3RhdHVzQmFySXRlbS5zZXRUZXh0KFwiXCIpO1xuXHRcdFx0dGhpcy5zdGF0dXNCYXJJdGVtLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBtaW4gPSBNYXRoLmZsb29yKHRoaXMucmVtYWluaW5nU2Vjb25kcyAvIDYwKTtcblx0XHRjb25zdCBzZWMgPSB0aGlzLnJlbWFpbmluZ1NlY29uZHMgJSA2MDtcblx0XHR0aGlzLnN0YXR1c0Jhckl0ZW0uc2V0VGV4dChgXHVEODNEXHVERUUxXHVGRTBGICR7bWlufToke3NlYy50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKX1gKTtcblx0XHR0aGlzLnN0YXR1c0Jhckl0ZW0uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cdH1cblxuXHQvKipcblx0ICogRm9ybWF0IGVsYXBzZWQgdGltZSBmb3IgbG9nZ2luZy5cblx0ICovXG5cdGZvcm1hdEVsYXBzZWQoc2Vjb25kczogbnVtYmVyKTogc3RyaW5nIHtcblx0XHRjb25zdCBtaW4gPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG5cdFx0Y29uc3Qgc2VjID0gc2Vjb25kcyAlIDYwO1xuXHRcdHJldHVybiBgJHttaW59IG1pbiAke3NlY30gc2VjYDtcblx0fVxuXG5cdHVubG9hZCgpOiB2b2lkIHtcblx0XHR0aGlzLnN0b3AoKTtcblx0XHR0aGlzLnN0YXR1c0Jhckl0ZW0ucmVtb3ZlKCk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogRW5zdXJlIHRoZSB0cmFja2VyIGZpbGUgZXhpc3RzLCBjcmVhdGluZyBpdCB3aXRoIGEgaGVhZGVyIGlmIG5vdC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZVRyYWNrZXJGaWxlKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGaWxlPiB7XG5cdGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKHBhdGgpO1xuXHRsZXQgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG5cdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHJldHVybiBmaWxlO1xuXG5cdC8vIENyZWF0ZSBuZXcgZmlsZSB3aXRoIGhlYWRlclxuXHRjb25zdCBoZWFkZXIgPSBgIyBTb2JyaWV0eSBUcmFja2VyXFxuXFxuIyMgRGFpbHkgQ2hlY2staW5zXFxuXFxuIyMgVXJnZSBMb2dcXG5cXG5gO1xuXHRmaWxlID0gYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShub3JtYWxpemVkLCBoZWFkZXIpO1xuXHRyZXR1cm4gZmlsZSBhcyBURmlsZTtcbn1cblxuLyoqXG4gKiBBcHBlbmQgYSBkYWlseSBjaGVjay1pbiBlbnRyeS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ0RhaWx5Q2hlY2tpbihcblx0YXBwOiBBcHAsXG5cdHBhdGg6IHN0cmluZyxcblx0c3RhdHVzOiBcInN1Y2Nlc3NcIiB8IFwicmVsYXBzZVwiLFxuXHRub3RlOiBzdHJpbmcgPSBcIlwiXG4pOiBQcm9taXNlPHZvaWQ+IHtcblx0Y29uc3QgZmlsZSA9IGF3YWl0IGVuc3VyZVRyYWNrZXJGaWxlKGFwcCwgcGF0aCk7XG5cdGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcblx0Y29uc3QgZGF0ZVN0ciA9IGZvcm1hdERhdGUodG9kYXkpO1xuXHRjb25zdCBlbnRyeSA9IGAtIFske3N0YXR1cyA9PT0gXCJzdWNjZXNzXCIgPyBcInhcIiA6IFwiIFwifV0gJHtkYXRlU3RyfSR7bm90ZSA/IFwiIFx1MjAxNCBcIiArIG5vdGUgOiBcIlwifVxcbmA7XG5cblx0bGV0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblx0Y29uc3Qgc2VjdGlvbk1hcmtlciA9IFwiIyMgRGFpbHkgQ2hlY2staW5zXCI7XG5cblx0Y29uc3QgaW5zZXJ0UG9zID0gY29udGVudC5pbmRleE9mKHNlY3Rpb25NYXJrZXIpO1xuXHRpZiAoaW5zZXJ0UG9zID09PSAtMSkge1xuXHRcdC8vIFNlY3Rpb24gbm90IGZvdW5kLCBhcHBlbmQgdG8gZW5kXG5cdFx0Y29udGVudCArPSBgXFxuIyMgRGFpbHkgQ2hlY2staW5zXFxuJHtlbnRyeX1gO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEluc2VydCBhZnRlciB0aGUgc2VjdGlvbiBoZWFkaW5nLCBiZWZvcmUgdGhlIG5leHQgc2VjdGlvbiBvciBlbmRcblx0XHRjb25zdCBhZnRlclNlY3Rpb24gPSBjb250ZW50LnNsaWNlKGluc2VydFBvcyArIHNlY3Rpb25NYXJrZXIubGVuZ3RoKTtcblx0XHRjb25zdCBuZXh0U2VjdGlvbiA9IGFmdGVyU2VjdGlvbi5zZWFyY2goL1xcbiMjIC8pO1xuXHRcdGNvbnN0IGluc2VydEF0ID0gbmV4dFNlY3Rpb24gPT09IC0xXG5cdFx0XHQ/IGNvbnRlbnQubGVuZ3RoXG5cdFx0XHQ6IGluc2VydFBvcyArIHNlY3Rpb25NYXJrZXIubGVuZ3RoICsgbmV4dFNlY3Rpb247XG5cdFx0Y29udGVudCA9IGNvbnRlbnQuc2xpY2UoMCwgaW5zZXJ0QXQpICsgXCJcXG5cIiArIGVudHJ5ICsgY29udGVudC5zbGljZShpbnNlcnRBdCk7XG5cdH1cblxuXHRhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xufVxuXG4vKipcbiAqIExvZyBhbiB1cmdlIGV2ZW50ICh2aWN0b3J5IG9yIHJlbGFwc2UpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9nVXJnZUV2ZW50KFxuXHRhcHA6IEFwcCxcblx0cGF0aDogc3RyaW5nLFxuXHR2aWN0b3J5OiBib29sZWFuLFxuXHRkdXJhdGlvbk1pbnV0ZXM6IG51bWJlcixcblx0bm90ZTogc3RyaW5nID0gXCJcIlxuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGNvbnN0IGZpbGUgPSBhd2FpdCBlbnN1cmVUcmFja2VyRmlsZShhcHAsIHBhdGgpO1xuXHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRjb25zdCBkYXRlU3RyID0gZm9ybWF0RGF0ZShub3cpO1xuXHRjb25zdCB0aW1lU3RyID0gZm9ybWF0VGltZShub3cpO1xuXHRjb25zdCB3ZWVrZGF5ID0gZm9ybWF0V2Vla2RheShub3cpO1xuXG5cdGNvbnN0IGVudHJ5ID0gdmljdG9yeVxuXHRcdD8gYC0gW3hdICR7ZGF0ZVN0cn0gJHt0aW1lU3RyfSBcdTIwMTQgVXJnZSByZXNpc3RlZCwgc3RheWVkIHN0cm9uZyBmb3IgJHtkdXJhdGlvbk1pbnV0ZXN9IG1pbiBcdTI3MTNcXG5gXG5cdFx0OiBgLSBbIF0gJHtkYXRlU3RyfSAke3RpbWVTdHJ9IFx1MjAxNCBSZWxhcHNlJHtub3RlID8gXCIgKFwiICsgbm90ZSArIFwiKVwiIDogXCJcIn0gXHUyNzE3XFxuYDtcblxuXHRsZXQgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXHRjb25zdCBzZWN0aW9uTWFya2VyID0gXCIjIyBVcmdlIExvZ1wiO1xuXG5cdGNvbnN0IGluc2VydFBvcyA9IGNvbnRlbnQuaW5kZXhPZihzZWN0aW9uTWFya2VyKTtcblx0aWYgKGluc2VydFBvcyA9PT0gLTEpIHtcblx0XHRjb250ZW50ICs9IGBcXG4jIyBVcmdlIExvZ1xcbiR7ZW50cnl9YDtcblx0fSBlbHNlIHtcblx0XHRjb25zdCBhZnRlclNlY3Rpb24gPSBjb250ZW50LnNsaWNlKGluc2VydFBvcyArIHNlY3Rpb25NYXJrZXIubGVuZ3RoKTtcblx0XHRjb25zdCBuZXh0U2VjdGlvbiA9IGFmdGVyU2VjdGlvbi5zZWFyY2goL1xcbiMjIC8pO1xuXHRcdGNvbnN0IGluc2VydEF0ID0gbmV4dFNlY3Rpb24gPT09IC0xXG5cdFx0XHQ/IGNvbnRlbnQubGVuZ3RoXG5cdFx0XHQ6IGluc2VydFBvcyArIHNlY3Rpb25NYXJrZXIubGVuZ3RoICsgbmV4dFNlY3Rpb247XG5cdFx0Y29udGVudCA9IGNvbnRlbnQuc2xpY2UoMCwgaW5zZXJ0QXQpICsgXCJcXG5cIiArIGVudHJ5ICsgY29udGVudC5zbGljZShpbnNlcnRBdCk7XG5cdH1cblxuXHRhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQpO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZSBjdXJyZW50IHN0cmVhayBpbiBkYXlzIChjb25zZWN1dGl2ZSBzdWNjZXNzZnVsIGNoZWNrLWlucykuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdHJlYWsoYXBwOiBBcHAsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG5cdGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgocGF0aCkpO1xuXHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gMDtcblxuXHRjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cblx0Ly8gUGFyc2UgZGFpbHkgY2hlY2staW5zIHNlY3Rpb25cblx0Y29uc3QgY2hlY2tpbk1hdGNoID0gY29udGVudC5tYXRjaCgvIyMgRGFpbHkgQ2hlY2staW5zXFxuKFtcXHNcXFNdKj8pKD86XFxuIyMgfCQpLyk7XG5cdGlmICghY2hlY2tpbk1hdGNoKSByZXR1cm4gMDtcblxuXHRjb25zdCBlbnRyaWVzID0gY2hlY2tpbk1hdGNoWzFdXG5cdFx0LnNwbGl0KFwiXFxuXCIpXG5cdFx0Lm1hcChsID0+IGwudHJpbSgpKVxuXHRcdC5maWx0ZXIobCA9PiAvXi0gXFxbKFsgeF0pXFxdIC8udGVzdChsKSk7XG5cblx0aWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcblxuXHQvLyBXYWxrIGJhY2t3YXJkcyBmcm9tIHRvZGF5IGNvdW50aW5nIGNvbnNlY3V0aXZlIHN1Y2Nlc3Nlc1xuXHRsZXQgc3RyZWFrID0gMDtcblx0Y29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpO1xuXHR0b2RheS5zZXRIb3VycygwLCAwLCAwLCAwKTtcblxuXHRmb3IgKGxldCBpID0gZW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdGNvbnN0IG1hdGNoID0gZW50cmllc1tpXS5tYXRjaCgvXi0gXFxbKFsgeF0pXFxdIChcXGR7NH0tXFxkezJ9LVxcZHsyfSkvKTtcblx0XHRpZiAoIW1hdGNoKSBicmVhaztcblxuXHRcdGNvbnN0IGlzQ2hlY2tlZCA9IG1hdGNoWzFdID09PSBcInhcIjtcblx0XHRpZiAoIWlzQ2hlY2tlZCkgYnJlYWs7IC8vIEJyZWFrIHN0cmVhayBvbiBmaXJzdCB1bmNoZWNrZWRcblxuXHRcdGNvbnN0IGVudHJ5RGF0ZSA9IG5ldyBEYXRlKG1hdGNoWzJdICsgXCJUMDA6MDA6MDBcIik7XG5cdFx0Y29uc3QgZXhwZWN0ZWREYXRlID0gbmV3IERhdGUodG9kYXkpO1xuXHRcdGV4cGVjdGVkRGF0ZS5zZXREYXRlKGV4cGVjdGVkRGF0ZS5nZXREYXRlKCkgLSAoZW50cmllcy5sZW5ndGggLSAxIC0gaSkpO1xuXG5cdFx0Ly8gQWxsb3cgZW50cmllcyB0byBiZSBpbiBvcmRlcjsgY291bnQgY29uc2VjdXRpdmUgY2hlY2tlZCBpdGVtc1xuXHRcdHN0cmVhaysrO1xuXHR9XG5cblx0cmV0dXJuIHN0cmVhaztcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkOiBEYXRlKTogc3RyaW5nIHtcblx0cmV0dXJuIGAke2QuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZC5nZXRNb250aCgpICsgMSl9LSR7cGFkKGQuZ2V0RGF0ZSgpKX1gO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUaW1lKGQ6IERhdGUpOiBzdHJpbmcge1xuXHRyZXR1cm4gYCR7cGFkKGQuZ2V0SG91cnMoKSl9OiR7cGFkKGQuZ2V0TWludXRlcygpKX1gO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRXZWVrZGF5KGQ6IERhdGUpOiBzdHJpbmcge1xuXHRjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuXHRyZXR1cm4gZGF5c1tkLmdldERheSgpXTtcbn1cblxuZnVuY3Rpb24gcGFkKG46IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiBuLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIFZpY3RvcnlNb2RhbCBleHRlbmRzIE1vZGFsIHtcblx0cHJpdmF0ZSBkdXJhdGlvbk1pbnV0ZXM6IG51bWJlcjtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgZHVyYXRpb25NaW51dGVzOiBudW1iZXIpIHtcblx0XHRzdXBlcihhcHApO1xuXHRcdHRoaXMuZHVyYXRpb25NaW51dGVzID0gZHVyYXRpb25NaW51dGVzO1xuXHR9XG5cblx0b25PcGVuKCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuXHRcdGNvbnRlbnRFbC5hZGRDbGFzcyhcInNvYnJpZXR5LXZpY3RvcnktbW9kYWxcIik7XG5cblx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdGNvbnN0IHRpbWVTdHIgPSBgJHtub3cuZ2V0RnVsbFllYXIoKX0tJHtwYWQobm93LmdldE1vbnRoKCkrMSl9LSR7cGFkKG5vdy5nZXREYXRlKCkpfSAke3BhZChub3cuZ2V0SG91cnMoKSl9OiR7cGFkKG5vdy5nZXRNaW51dGVzKCkpfWA7XG5cblx0XHRjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJhZGdlXCIsIHRleHQ6IFwiXHVEODNDXHVERjk2XCIgfSk7XG5cdFx0Y29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIllvdSBEaWQgSXQhXCIgfSk7XG5cdFx0Y29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJzdWJ0aXRsZVwiLCB0ZXh0OiBcIllvdSByZXNpc3RlZCB0aGUgdXJnZVwiIH0pO1xuXHRcdGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwidGltZS1pbmZvXCIsIHRleHQ6IGAke3RpbWVTdHJ9IFx1MDBCNyBTdGF5ZWQgc3Ryb25nIGZvciAke3RoaXMuZHVyYXRpb25NaW51dGVzfSBtaW51dGVzYCB9KTtcblxuXHRcdGNvbnN0IG1zZyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibWVzc2FnZVwiIH0pO1xuXHRcdG1zZy5pbm5lckhUTUwgPSBgXG5cdFx0XHRFdmVyeSByZXNpc3RhbmNlIHJlc2hhcGVzIHlvdXIgYnJhaW4uPGJyPlxuXHRcdFx0WW91J3JlIG5vdCA8c3Ryb25nPmxvc2luZzwvc3Ryb25nPiBhbnl0aGluZyBcdTIwMTQgeW91J3JlIDxzdHJvbmc+d2lubmluZzwvc3Ryb25nPiB5b3Vyc2VsZiBiYWNrLjxicj48YnI+XG5cdFx0XHRUaGUgdXJnZSB3YXMganVzdCBwYXNzaW5nIHRocm91Z2guIFlvdSBhcmUgdGhlIG9uZSBpbiBjb250cm9sLlxuXHRcdGA7XG5cblx0XHRjb25zdCBxdW90ZSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicXVvdGVcIiB9KTtcblx0XHRxdW90ZS5pbm5lckhUTUwgPSBgXG5cdFx0XHQmbGRxdW87QmV0d2VlbiBzdGltdWx1cyBhbmQgcmVzcG9uc2UgdGhlcmUgaXMgYSBzcGFjZS48YnI+XG5cdFx0XHRJbiB0aGF0IHNwYWNlIGlzIG91ciBwb3dlciB0byBjaG9vc2Ugb3VyIHJlc3BvbnNlLiZyZHF1bzs8YnI+XG5cdFx0XHQmbWRhc2g7IFZpa3RvciBGcmFua2xcblx0XHRgO1xuXG5cdFx0Ly8gTGF1bmNoIGNvbmZldHRpXG5cdFx0dGhpcy5sYXVuY2hDb25mZXR0aSgpO1xuXHR9XG5cblx0b25DbG9zZSgpOiB2b2lkIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblx0fVxuXG5cdHByaXZhdGUgbGF1bmNoQ29uZmV0dGkoKTogdm9pZCB7XG5cdFx0Y29uc3QgY29sb3JzID0gW1wiI2Y3ZDk0ZVwiLCBcIiNmNWE2MjNcIiwgXCIjZmY2YjZiXCIsIFwiIzQ4ZGJmYlwiLCBcIiNmZjlmZjNcIiwgXCIjNTRhMGZmXCIsIFwiIzVmMjdjZFwiXTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgNjA7IGkrKykge1xuXHRcdFx0Y29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0ZWwuYWRkQ2xhc3MoXCJzb2JyaWV0eS1jb25mZXR0aVwiKTtcblx0XHRcdGVsLnN0eWxlLmxlZnQgPSBNYXRoLnJhbmRvbSgpICogMTAwICsgXCIlXCI7XG5cdFx0XHRlbC5zdHlsZS53aWR0aCA9ICg2ICsgTWF0aC5yYW5kb20oKSAqIDgpICsgXCJweFwiO1xuXHRcdFx0ZWwuc3R5bGUuaGVpZ2h0ID0gKDYgKyBNYXRoLnJhbmRvbSgpICogOCkgKyBcInB4XCI7XG5cdFx0XHRlbC5zdHlsZS5iYWNrZ3JvdW5kID0gY29sb3JzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNvbG9ycy5sZW5ndGgpXTtcblx0XHRcdGVsLnN0eWxlLmJvcmRlclJhZGl1cyA9IE1hdGgucmFuZG9tKCkgPiAwLjUgPyBcIjUwJVwiIDogXCIycHhcIjtcblx0XHRcdGVsLnN0eWxlLmFuaW1hdGlvbkR1cmF0aW9uID0gKDIgKyBNYXRoLnJhbmRvbSgpICogMykgKyBcInNcIjtcblx0XHRcdGVsLnN0eWxlLmFuaW1hdGlvbkRlbGF5ID0gTWF0aC5yYW5kb20oKSAqIDIgKyBcInNcIjtcblxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG5cblx0XHRcdC8vIFJlbW92ZSBhZnRlciBhbmltYXRpb25cblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRpZiAoZWwucGFyZW50Tm9kZSkgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG5cdFx0XHR9LCA2MDAwKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFkKG46IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiBuLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7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LGFBQWFDLEtBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxNQUFNQSxLQUFJLElBQUksV0FBVyxDQUFDO0FBQ25FLFlBQU0sYUFBYSxJQUFJLFdBQVc7QUFHbEMsVUFBSSxlQUFlLEtBQUssU0FBUyxnQkFBZ0IsYUFBYSxJQUFJO0FBQ2pFLFlBQUksYUFBYSwrQkFBd0I7QUFBQSxVQUN4QyxNQUFNO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsR0FBRyxhQUFhO0FBQUEsRUFDakI7QUFBQSxFQUVBLGVBQXFCO0FBQ3BCLFFBQUksS0FBSyx1QkFBdUIsTUFBTTtBQUNyQyxhQUFPLGNBQWMsS0FBSyxrQkFBa0I7QUFDNUMsV0FBSyxxQkFBcUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Q7QUFDRDtBQUVBLFNBQVNBLEtBQUksR0FBbUI7QUFDL0IsU0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUNwQzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAicGFkIiwgInBhZCJdCn0K
