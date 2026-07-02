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
var import_obsidian7 = require("obsidian");

// src/confirm-modal.ts
var import_obsidian = require("obsidian");
function showConfirmModal(app, title, message, okText = "OK", cancelText = "Cancel") {
  return new Promise((resolve) => {
    const modal = new import_obsidian.Modal(app);
    modal.titleEl.setText(title);
    modal.contentEl.createEl("p", { text: message });
    const btnDiv = modal.contentEl.createDiv();
    btnDiv.style.display = "flex";
    btnDiv.style.gap = "12px";
    btnDiv.style.justifyContent = "center";
    btnDiv.style.marginTop = "16px";
    new import_obsidian.Setting(btnDiv).addButton(
      (btn) => btn.setButtonText(cancelText).onClick(() => {
        modal.close();
        resolve(false);
      })
    ).addButton(
      (btn) => btn.setButtonText(okText).setCta().onClick(() => {
        modal.close();
        resolve(true);
      })
    );
    modal.open();
  });
}

// src/settings.ts
var import_obsidian2 = require("obsidian");

// src/lang.ts
var en = {
  settings: {
    trackerFilePath: { name: "Tracker file path", desc: "Path to the note where check-ins and urge logs are recorded (relative to vault root)" },
    urgeTimerDuration: { name: "Urge timer duration", desc: "How many minutes the urge timer should count down" },
    enableReminder: { name: "Enable daily reminder", desc: "Show a notification at the set time to prompt daily check-in" },
    reminderTime: { name: "Reminder time", desc: "Time for the daily check-in reminder" },
    reminderTolerance: { name: "Missed reminder tolerance", desc: "If Obsidian is closed at reminder time, fire it anyway within this many minutes after. E.g., reminder at 20:30, tolerance 120min \u2192 if you open Obsidian at 22:00 it still fires. 0 = never catch up." },
    language: { name: "Language", desc: "Display language" }
  },
  urgeTimer: {
    confirmTitle: "\u{1F494} Confirm Relapse",
    confirmMsg: "Are you sure you want to relapse?",
    confirmOk: "Yes, relapse",
    confirmCancel: "Keep going",
    heldStrong: "You held strong for",
    noTimer: "\u23F9 No timer running.",
    timerCancelled: "\u{1F494} Timer cancelled",
    timerStarted: "\u{1F6E1}\uFE0F Urge Timer Started",
    timerStartedBody: "Target: 30 minutes. Stay strong!",
    victoryNotifTitle: "\u{1F389} You did it!",
    victoryNotifBody: "You resisted the urge for 30 minutes!",
    cancelledNotifBody: "You lasted"
  },
  reminder: {
    notice: "\u{1F514} Sobriety check-in time! How was today?",
    notifTitle: "\u{1F514} Sobriety Check-in",
    notifBody: "Time for your daily check-in! How was today?",
    modalTitle: "\u{1F514} Daily Check-in",
    modalMsg: "How was today?",
    okSuccess: "Successful \u2713",
    okRelapse: "Relapse \u2717",
    recorded: "\u2705 Check-in recorded! Current streak:",
    failed: "\u274C Failed to record check-in."
  },
  victory: {
    title: "You Did It!",
    subtitle: "You resisted the urge",
    timeInfo: "Stayed strong for",
    msg: "Every resistance reshapes your brain. You're not <strong>losing</strong> anything \u2014 you're <strong>winning</strong> yourself back.",
    msgStrong: "winning",
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    quoteAuthor: "Viktor Frankl"
  },
  dashboard: {
    title: "Sobriety Dashboard",
    dayStreak: "day streak",
    successRate: "Success rate",
    totalDays: "Total days",
    successful: "Successful",
    relapses: "Relapses",
    thisWeek: "This Week",
    thisMonth: "This Month",
    urgeLog: "Urge Log",
    wins: "Wins",
    recent: "Recent",
    refresh: "\u{1F504} Refresh",
    successfulSuffix: "Successful",
    relapseSuffix: "Relapse"
  }
};
var zh = {
  settings: {
    trackerFilePath: { name: "\u8FFD\u8E2A\u6587\u4EF6\u8DEF\u5F84", desc: "\u8BB0\u5F55\u6BCF\u65E5\u6253\u5361\u548C\u51B2\u52A8\u65E5\u5FD7\u7684\u6587\u4EF6\u8DEF\u5F84\uFF08\u76F8\u5BF9\u4E8E vault \u6839\u76EE\u5F55\uFF09" },
    urgeTimerDuration: { name: "\u51B2\u52A8\u8BA1\u65F6\u65F6\u957F", desc: "\u51B2\u52A8\u8BA1\u65F6\u5668\u5012\u8BA1\u65F6\u5206\u949F\u6570" },
    enableReminder: { name: "\u5F00\u542F\u6BCF\u65E5\u63D0\u9192", desc: "\u5728\u6307\u5B9A\u65F6\u95F4\u5F39\u51FA\u901A\u77E5\uFF0C\u63D0\u9192\u6BCF\u65E5\u6253\u5361" },
    reminderTime: { name: "\u63D0\u9192\u65F6\u95F4", desc: "\u6BCF\u65E5\u6253\u5361\u63D0\u9192\u65F6\u95F4" },
    reminderTolerance: { name: "\u9519\u8FC7\u5BB9\u5DEE", desc: "\u5982\u679C Obsidian \u5728\u63D0\u9192\u65F6\u95F4\u6CA1\u6253\u5F00\uFF0C\u5EF6\u540E\u591A\u5C11\u5206\u949F\u5185\u4ECD\u8865\u53D1\u63D0\u9192\u3002\u4F8B\u5982\uFF1A\u63D0\u9192 20:30\uFF0C\u5BB9\u5DEE 120 \u5206\u949F \u2192 22:00 \u6253\u5F00\u4ECD\u4F1A\u5F39\u30020 = \u4E0D\u8865\u53D1\u3002" },
    language: { name: "\u8BED\u8A00", desc: "\u754C\u9762\u663E\u793A\u8BED\u8A00" }
  },
  urgeTimer: {
    confirmTitle: "\u{1F494} \u786E\u8BA4\u7834\u6212",
    confirmMsg: "\u786E\u5B9A\u8981\u7834\u6212\u5417\uFF1F",
    confirmOk: "\u786E\u5B9A\u7834\u6212",
    confirmCancel: "\u7EE7\u7EED\u575A\u6301",
    heldStrong: "\u5DF2\u575A\u6301",
    noTimer: "\u23F9 \u6CA1\u6709\u6B63\u5728\u8FD0\u884C\u7684\u8BA1\u65F6\u5668",
    timerCancelled: "\u{1F494} \u5DF2\u53D6\u6D88",
    timerStarted: "\u{1F6E1}\uFE0F \u51B2\u52A8\u8BA1\u65F6\u5DF2\u542F\u52A8",
    timerStartedBody: "\u76EE\u6807 30 \u5206\u949F\uFF0C\u52A0\u6CB9\uFF01",
    victoryNotifTitle: "\u{1F389} \u4F60\u505A\u5230\u4E86\uFF01",
    victoryNotifBody: "\u4F60\u6210\u529F\u62B5\u6297\u4E86\u51B2\u52A8 30 \u5206\u949F\uFF01",
    cancelledNotifBody: "\u4F60\u575A\u6301\u4E86"
  },
  reminder: {
    notice: "\u{1F514} \u6212\u8272\u6253\u5361\u65F6\u95F4\uFF01\u4ECA\u5929\u600E\u4E48\u6837\uFF1F",
    notifTitle: "\u{1F514} \u6212\u8272\u6253\u5361\u63D0\u9192",
    notifBody: "\u5230\u6253\u5361\u65F6\u95F4\u4E86\uFF01\u4ECA\u5929\u60C5\u51B5\u5982\u4F55\uFF1F",
    modalTitle: "\u{1F514} \u6BCF\u65E5\u6253\u5361",
    modalMsg: "\u4ECA\u5929\u600E\u4E48\u6837\uFF1F",
    okSuccess: "\u987A\u5229 \u2713",
    okRelapse: "\u7834\u6212 \u2717",
    recorded: "\u2705 \u6253\u5361\u5DF2\u8BB0\u5F55\uFF01\u5F53\u524D\u8FDE\u7EED\u5929\u6570\uFF1A",
    failed: "\u274C \u6253\u5361\u8BB0\u5F55\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u8BB0\u5F55\u3002"
  },
  victory: {
    title: "\u4F60\u505A\u5230\u4E86\uFF01",
    subtitle: "\u4F60\u62B5\u6297\u4E86\u51B2\u52A8",
    timeInfo: "\u575A\u6301\u4E86",
    msg: "\u6BCF\u4E00\u6B21\u62B5\u6297\u90FD\u5728\u91CD\u5851\u4F60\u7684\u5927\u8111\u3002\u4F60\u4E0D\u662F\u5728<strong>\u5931\u53BB</strong>\u4EC0\u4E48\uFF0C\u800C\u662F\u5728<strong>\u8D62\u56DE</strong>\u81EA\u5DF1\u3002",
    msgStrong: "\u8D62\u56DE",
    quote: "\u5728\u523A\u6FC0\u4E0E\u56DE\u5E94\u4E4B\u95F4\uFF0C\u6709\u4E00\u4E2A\u7A7A\u95F4\u3002\u90A3\u4E2A\u7A7A\u95F4\u91CC\uFF0C\u662F\u6211\u4EEC\u9009\u62E9\u56DE\u5E94\u7684\u81EA\u7531\u3002",
    quoteAuthor: "\u2014\u2014\u7EF4\u514B\u591A\xB7\u5F17\u5170\u514B\u5C14"
  },
  dashboard: {
    title: "\u6212\u8272\u4EEA\u8868\u76D8",
    dayStreak: "\u5929\u8FDE\u7EED",
    successRate: "\u6210\u529F\u7387",
    totalDays: "\u603B\u5929\u6570",
    successful: "\u987A\u5229",
    relapses: "\u7834\u6212",
    thisWeek: "\u672C\u5468",
    thisMonth: "\u672C\u6708",
    urgeLog: "\u51B2\u52A8\u65E5\u5FD7",
    wins: "\u83B7\u80DC",
    recent: "\u6700\u8FD1\u8BB0\u5F55",
    refresh: "\u{1F504} \u5237\u65B0",
    successfulSuffix: "\u987A\u5229",
    relapseSuffix: "\u7834\u6212"
  }
};
function getLang(lang) {
  return lang === "zh" ? zh : en;
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  trackerFilePath: "sobriety-tracker.md",
  urgeTimerMinutes: 30,
  reminderTime: "20:30",
  enableReminder: true,
  language: "en",
  reminderToleranceMinutes: 120,
  lastReminderDate: ""
};
var SobrietySettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("sobriety-settings");
    const L = getLang(this.plugin.settings.language).settings;
    new import_obsidian2.Setting(containerEl).setName(L.trackerFilePath.name).setDesc(L.trackerFilePath.desc).addText((text) => text.setPlaceholder("sobriety-tracker.md").setValue(this.plugin.settings.trackerFilePath).onChange(async (val) => {
      this.plugin.settings.trackerFilePath = val || "sobriety-tracker.md";
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName(L.urgeTimerDuration.name).setDesc(L.urgeTimerDuration.desc).addSlider((slider) => slider.setLimits(5, 120, 5).setValue(this.plugin.settings.urgeTimerMinutes).setDynamicTooltip().onChange(async (val) => {
      this.plugin.settings.urgeTimerMinutes = val;
      await this.plugin.saveSettings();
    }));
    const reminderEnabled = this.plugin.settings.enableReminder;
    new import_obsidian2.Setting(containerEl).setName(L.enableReminder.name).setDesc(L.enableReminder.desc).addToggle((toggle) => toggle.setValue(reminderEnabled).onChange(async (val) => {
      this.plugin.settings.enableReminder = val;
      await this.plugin.saveSettings();
      if (val) this.plugin.startReminder();
      else this.plugin.stopReminder();
      this.display();
    }));
    const timeSetting = new import_obsidian2.Setting(containerEl).setName(L.reminderTime.name).setDesc(L.reminderTime.desc).addText((text) => {
      text.inputEl.type = "time";
      text.setValue(this.plugin.settings.reminderTime);
      text.onChange(async (val) => {
        if (/^\d{2}:\d{2}$/.test(val)) {
          this.plugin.settings.reminderTime = val;
          await this.plugin.saveSettings();
          if (this.plugin.settings.enableReminder) this.plugin.startReminder();
        }
      });
    });
    timeSetting.settingEl.style.display = reminderEnabled ? "" : "none";
    const tolSetting = new import_obsidian2.Setting(containerEl).setName(L.reminderTolerance.name).setDesc(L.reminderTolerance.desc).addSlider(
      (slider) => slider.setLimits(0, 180, 15).setValue(this.plugin.settings.reminderToleranceMinutes).setDynamicTooltip().onChange(async (val) => {
        this.plugin.settings.reminderToleranceMinutes = val;
        await this.plugin.saveSettings();
      })
    );
    tolSetting.settingEl.style.display = reminderEnabled ? "" : "none";
    new import_obsidian2.Setting(containerEl).setName(L.language.name).setDesc(L.language.desc).addDropdown((drop) => {
      drop.addOption("en", "English");
      drop.addOption("zh", "\u4E2D\u6587");
      drop.setValue(this.plugin.settings.language);
      drop.onChange(async (val) => {
        this.plugin.settings.language = val;
        await this.plugin.saveSettings();
        this.display();
      });
    });
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
  async confirmCancel(L) {
    const elapsed = this.elapsedSeconds;
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    let msg = L.confirmMsg;
    if (elapsed > 0) msg += `
${L.heldStrong} ${min}m ${sec}s.`;
    return showConfirmModal(this.app, L.confirmTitle, msg, L.confirmOk, L.confirmCancel);
  }
  /**
   * Silently stop without logging (for restart / fresh start).
   */
  reset() {
    this.stop();
    this.remainingSeconds = 0;
    this.startTime = null;
    this.updateDisplay();
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
  const entry = `- ${dateStr}${note ? " \u2014 " + note : ""} ${status === "success" ? "\u2713" : "\u2717"}
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
  const entry = victory ? `- ${dateStr} ${timeStr} \u2713 Urge resisted, stayed strong for ${durationMinutes} min
` : `- ${dateStr} ${timeStr} \u2717 Relapse${note ? " (" + note + ")" : ""}
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
  const entries = checkinMatch[1].split("\n").map((l) => l.trim()).filter((l) => /^- \d{4}-\d{2}-\d{2}/.test(l));
  if (entries.length === 0) return 0;
  let streak = 0;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = entries.length - 1; i >= 0; i--) {
    const match = entries[i].match(/^- (\d{4}-\d{2}-\d{2})/);
    if (!match) break;
    const isChecked = entries[i].includes("\u2713");
    if (!isChecked) break;
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
  constructor(app, durationMinutes, langPack) {
    super(app);
    this.durationMinutes = durationMinutes;
    this.L = langPack;
  }
  onOpen() {
    const { contentEl } = this;
    const L = this.L;
    contentEl.addClass("sobriety-victory-modal");
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    contentEl.createDiv({ cls: "badge", text: "\u{1F396}" });
    contentEl.createEl("h2", { text: L.title });
    contentEl.createDiv({ cls: "subtitle", text: L.subtitle });
    contentEl.createDiv({ cls: "time-info", text: `${timeStr} \xB7 ${L.timeInfo} ${this.durationMinutes} min` });
    const msg = contentEl.createDiv({ cls: "message" });
    msg.innerHTML = L.msg;
    const quote = contentEl.createDiv({ cls: "quote" });
    quote.innerHTML = `&ldquo;${L.quote}&rdquo;<br>&mdash; ${L.quoteAuthor}`;
    this.launchConfetti();
  }
  onClose() {
    this.contentEl.empty();
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
      setTimeout(() => el.parentNode?.removeChild(el), 6e3);
    }
  }
};
function pad2(n) {
  return n.toString().padStart(2, "0");
}

// src/dashboard-view.ts
var import_obsidian6 = require("obsidian");

// src/stats.ts
var import_obsidian5 = require("obsidian");
async function computeStats(app, path) {
  const file = app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(path));
  if (!(file instanceof import_obsidian5.TFile)) return emptyStats();
  const content = await app.vault.read(file);
  const dailyEntries = parseDailyCheckins(content);
  const urgeEntries = parseUrgeLog(content);
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let streak = 0;
  let totalSuccess = 0;
  let totalRelapse = 0;
  let weekSuccess = 0;
  let weekRelapse = 0;
  let monthSuccess = 0;
  let monthRelapse = 0;
  const sorted = [...dailyEntries].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (const entry of sorted) {
    if (entry.success) {
      totalSuccess++;
      if (streak === 0) {
        const diff = Math.round((today.getTime() - entry.date.getTime()) / 864e5);
        if (diff <= 1) streak++;
        else break;
      } else {
        streak++;
      }
    } else {
      totalRelapse++;
      streak = 0;
    }
    if (entry.date >= weekStart) {
      if (entry.success) weekSuccess++;
      else weekRelapse++;
    }
    if (entry.date >= monthStart) {
      if (entry.success) monthSuccess++;
      else monthRelapse++;
    }
  }
  const totalUrgeWins = urgeEntries.filter((e) => e.success).length;
  const totalUrgeRelapses = urgeEntries.filter((e) => !e.success).length;
  const totalDays = totalSuccess + totalRelapse;
  const successRate = totalDays > 0 ? Math.round(totalSuccess / totalDays * 100) : 0;
  const last7Entries = sorted.slice(0, 7).map((e) => ({
    date: formatDate2(e.date),
    success: e.success
  }));
  return {
    streak,
    totalSuccess,
    totalRelapse,
    totalUrgeWins,
    totalUrgeRelapses,
    successRate,
    totalDays,
    weekSuccess,
    weekRelapse,
    monthSuccess,
    monthRelapse,
    last7Entries
  };
}
function parseDailyCheckins(content) {
  const section = content.match(/## Daily Check-ins\n([\s\S]*?)(?:\n## |$)/);
  if (!section) return [];
  return section[1].split("\n").map((l) => l.trim()).filter((l) => l.startsWith("- ")).map((l) => {
    const dateMatch = l.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;
    const success = l.includes("\u2713");
    return { date: /* @__PURE__ */ new Date(dateMatch[1] + "T00:00:00"), success };
  }).filter((e) => e !== null);
}
function parseUrgeLog(content) {
  const section = content.match(/## Urge Log\n([\s\S]*?)(?:\n## |$)/);
  if (!section) return [];
  return section[1].split("\n").map((l) => l.trim()).filter((l) => l.startsWith("- ")).map((l) => {
    const success = l.includes("\u2713");
    return { date: /* @__PURE__ */ new Date(), success };
  });
}
function emptyStats() {
  return {
    streak: 0,
    totalSuccess: 0,
    totalRelapse: 0,
    totalUrgeWins: 0,
    totalUrgeRelapses: 0,
    successRate: 0,
    totalDays: 0,
    weekSuccess: 0,
    weekRelapse: 0,
    monthSuccess: 0,
    monthRelapse: 0,
    last7Entries: []
  };
}
function formatDate2(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// src/dashboard-view.ts
var VIEW_TYPE_DASHBOARD = "sobriety-dashboard";
var DashboardView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_DASHBOARD;
  }
  getDisplayText() {
    return "Sobriety Dashboard";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    await this.refresh();
  }
  async refresh() {
    const stats = await computeStats(this.app, this.plugin.settings.trackerFilePath);
    this.render(stats, this.plugin.L.dashboard);
  }
  render(s, L) {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("sobriety-dashboard");
    contentEl.createEl("h2", { text: L.title });
    const card = contentEl.createDiv({ cls: "sobriety-card" });
    const emoji = s.streak >= 30 ? "\u{1F525}" : s.streak >= 7 ? "\u{1F4AA}" : s.streak >= 1 ? "\u2B50" : "\u{1F331}";
    card.createEl("div", { cls: "sobriety-streak-num", text: `${s.streak}` });
    card.createEl("div", { cls: "sobriety-streak-label", text: `${emoji} ${s.streak} ${L.dayStreak}` });
    const grid = contentEl.createDiv({ cls: "sobriety-stats-grid" });
    this.box(grid, L.successRate, `${s.successRate}%`, s.successRate >= 70 ? "green" : s.successRate >= 40 ? "yellow" : "red");
    this.box(grid, L.totalDays, `${s.totalDays}`, "default");
    this.box(grid, L.successful, `${s.totalSuccess}`, "green");
    this.box(grid, L.relapses, `${s.totalRelapse}`, "red");
    contentEl.createEl("h3", { text: L.thisWeek });
    const wg = contentEl.createDiv({ cls: "sobriety-stats-grid" });
    this.box(wg, L.successful, `${s.weekSuccess}`, "green");
    this.box(wg, L.relapses, `${s.weekRelapse}`, "red");
    contentEl.createEl("h3", { text: L.thisMonth });
    const mg = contentEl.createDiv({ cls: "sobriety-stats-grid" });
    this.box(mg, L.successful, `${s.monthSuccess}`, "green");
    this.box(mg, L.relapses, `${s.monthRelapse}`, "red");
    contentEl.createEl("h3", { text: L.urgeLog });
    const ug = contentEl.createDiv({ cls: "sobriety-stats-grid" });
    this.box(ug, L.wins, `${s.totalUrgeWins}`, "green");
    this.box(ug, L.relapses, `${s.totalUrgeRelapses}`, "red");
    if (s.last7Entries.length > 0) {
      contentEl.createEl("h3", { text: L.recent });
      const list = contentEl.createEl("ul", { cls: "sobriety-recent" });
      for (const e of s.last7Entries) {
        const label = e.success ? L.successfulSuffix : L.relapseSuffix;
        const li = list.createEl("li", { text: `${e.date}  ${e.success ? "\u2713" : "\u2717"} ${label}` });
        li.style.color = e.success ? "var(--color-green)" : "var(--color-red)";
      }
    }
    const btn = contentEl.createDiv({ cls: "sobriety-dashboard-btn" });
    btn.createEl("button", { text: L.refresh }).onclick = () => this.refresh();
  }
  box(container, label, value, color) {
    const b = container.createDiv({ cls: `sobriety-stat-box sobriety-stat-${color}` });
    b.createEl("div", { cls: "sobriety-stat-value", text: value });
    b.createEl("div", { cls: "sobriety-stat-label", text: label });
  }
};

// src/main.ts
var SobrietyTrackerPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.reminderIntervalId = null;
  }
  // Convenience getter for current lang pack
  get L() {
    return getLang(this.settings.language);
  }
  async onload() {
    await this.loadSettings();
    this.urgeTimer = new UrgeTimer(this, this.app);
    this.urgeTimer.onVictory = () => this.handleVictory();
    this.urgeTimer.onRelapse = (d) => this.handleRelapse(d);
    this.addRibbonIcon("shield", "Start urge timer", () => this.handleStartUrgeTimer());
    this.addCommand({
      id: "start-urge-timer",
      name: "Start urge timer",
      icon: "shield",
      callback: () => this.handleStartUrgeTimer()
    });
    this.addCommand({
      id: "cancel-urge-timer",
      name: "Cancel urge timer (relapse)",
      icon: "x-circle",
      callback: async () => {
        if (!this.urgeTimer.isRunning) {
          new import_obsidian7.Notice(this.L.urgeTimer.noTimer);
          return;
        }
        const confirmed = await this.urgeTimer.confirmCancel(this.L.urgeTimer);
        if (confirmed) this.urgeTimer.cancel();
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
    this.registerView(VIEW_TYPE_DASHBOARD, (leaf) => new DashboardView(leaf, this));
    this.addCommand({
      id: "open-dashboard",
      name: "Open dashboard",
      icon: "calendar",
      callback: () => this.openDashboard()
    });
    if (this.settings.enableReminder) {
      this.startReminder();
      this.checkMissedReminder();
    }
  }
  onunload() {
    this.stopReminder();
    this.urgeTimer.unload();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ── Urge timer ──
  async handleStartUrgeTimer() {
    if (this.urgeTimer.isRunning) {
      const U = this.L.urgeTimer;
      const ok = await showConfirmModal(this.app, U.confirmTitle, U.confirmMsg, U.confirmOk, U.confirmCancel);
      if (!ok) return;
      this.urgeTimer.cancel();
      return;
    }
    this.urgeTimer.start(this.settings.urgeTimerMinutes);
  }
  handleVictory() {
    logUrgeEvent(this.app, this.settings.trackerFilePath, true, this.settings.urgeTimerMinutes).catch((e) => console.error("Failed to log victory:", e));
    new VictoryModal(this.app, this.settings.urgeTimerMinutes, this.L.victory).open();
  }
  handleRelapse(durationSeconds) {
    const durMin = Math.floor(durationSeconds / 60);
    logUrgeEvent(this.app, this.settings.trackerFilePath, false, durMin).catch((e) => console.error("Failed to log relapse:", e));
  }
  // ── Daily check-in ──
  async dailyCheckin(status) {
    try {
      await logDailyCheckin(this.app, this.settings.trackerFilePath, status);
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new import_obsidian7.Notice(`${this.L.reminder.recorded} ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new import_obsidian7.Notice(this.L.reminder.failed);
      console.error("Check-in error:", e);
    }
  }
  // ── Streak ──
  async showStreak() {
    try {
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new import_obsidian7.Notice(`\u{1F525} ${this.L.dashboard.dayStreak.replace("day streak", "")} ${streak} ${this.L.dashboard.dayStreak}`);
    } catch (e) {
      new import_obsidian7.Notice("\u274C Could not calculate streak.");
    }
  }
  // ── Dashboard ──
  async openDashboard() {
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
    this.reminderIntervalId = window.setInterval(() => {
      if (!this.settings.enableReminder) return;
      const now = /* @__PURE__ */ new Date();
      const cur = pad3(now.getHours()) + ":" + pad3(now.getMinutes());
      if (cur === this.settings.reminderTime && now.getSeconds() < 10) this.fireReminder();
    }, 6e4);
  }
  async fireReminder() {
    const R = this.L.reminder;
    new import_obsidian7.Notice(R.notice);
    try {
      new Notification(R.notifTitle, { body: R.notifBody });
    } catch (_) {
    }
    const success = await showConfirmModal(this.app, R.modalTitle, R.modalMsg, R.okSuccess, R.okRelapse);
    try {
      await logDailyCheckin(this.app, this.settings.trackerFilePath, success ? "success" : "relapse");
      const streak = await getStreak(this.app, this.settings.trackerFilePath);
      new import_obsidian7.Notice(`${R.recorded} ${streak} day${streak !== 1 ? "s" : ""}`);
    } catch (e) {
      new import_obsidian7.Notice(R.failed);
      console.error("Check-in error:", e);
    }
    this.settings.lastReminderDate = todayStr();
    await this.saveSettings();
  }
  /**
   * On startup, check if today's reminder time has passed but is within tolerance.
   * Only fires if the reminder hasn't been fired today yet. One-sided: only triggers
   * when current time is AFTER the reminder time (never before).
   */
  async checkMissedReminder() {
    const tol = this.settings.reminderToleranceMinutes;
    if (tol <= 0) return;
    const now = /* @__PURE__ */ new Date();
    const today = todayStr();
    if (this.settings.lastReminderDate === today) return;
    const [h, m] = this.settings.reminderTime.split(":").map(Number);
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    const diffMin = (now.getTime() - target.getTime()) / 6e4;
    if (diffMin > 0 && diffMin <= tol) {
      console.log(`Sobriety: missed reminder by ${Math.round(diffMin)}m, firing within tolerance`);
      await this.fireReminder();
    }
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
function todayStr() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad3(d.getMonth() + 1)}-${pad3(d.getDate())}`;
}
