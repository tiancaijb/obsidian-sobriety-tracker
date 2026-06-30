export type UrgeTimerPack = LangPack["urgeTimer"];
export type ReminderPack = LangPack["reminder"];
export type VictoryPack = LangPack["victory"];
export type DashboardPack = LangPack["dashboard"];
export type SettingsPack = LangPack["settings"];

export type Lang = "en" | "zh";

export interface LangPack {
	// ── Settings ──
	settings: {
		trackerFilePath: { name: string; desc: string };
		urgeTimerDuration: { name: string; desc: string };
		enableReminder: { name: string; desc: string };
		reminderTime: { name: string; desc: string };
		language: { name: string; desc: string };
	};

	// ── Urge timer ──
	urgeTimer: {
		confirmTitle: string;
		confirmMsg: string;
		confirmOk: string;
		confirmCancel: string;
		heldStrong: string;
		noTimer: string;
		timerCancelled: string;
		timerStarted: string;
		timerStartedBody: string;
		victoryNotifTitle: string;
		victoryNotifBody: string;
		cancelledNotifBody: string;
	};

	// ── Daily reminder ──
	reminder: {
		notice: string;
		notifTitle: string;
		notifBody: string;
		modalTitle: string;
		modalMsg: string;
		okSuccess: string;
		okRelapse: string;
		recorded: string;
		failed: string;
	};

	// ── Victory modal ──
	victory: {
		title: string;
		subtitle: string;
		timeInfo: string;
		msg: string;
		msgStrong: string;
		quote: string;
		quoteAuthor: string;
	};

	// ── Dashboard ──
	dashboard: {
		title: string;
		dayStreak: string;
		successRate: string;
		totalDays: string;
		successful: string;
		relapses: string;
		thisWeek: string;
		thisMonth: string;
		urgeLog: string;
		wins: string;
		recent: string;
		refresh: string;
		successfulSuffix: string;
		relapseSuffix: string;
	};
}

export const en: LangPack = {
	settings: {
		trackerFilePath: { name: "Tracker file path", desc: "Path to the note where check-ins and urge logs are recorded (relative to vault root)" },
		urgeTimerDuration: { name: "Urge timer duration", desc: "How many minutes the urge timer should count down" },
		enableReminder: { name: "Enable daily reminder", desc: "Show a notification at the set time to prompt daily check-in" },
		reminderTime: { name: "Reminder time", desc: "Time for the daily check-in reminder" },
		language: { name: "Language", desc: "Display language" },
	},
	urgeTimer: {
		confirmTitle: "💔 Confirm Relapse",
		confirmMsg: "Are you sure you want to relapse?",
		confirmOk: "Yes, relapse",
		confirmCancel: "Keep going",
		heldStrong: "You held strong for",
		noTimer: "⏹ No timer running.",
		timerCancelled: "💔 Timer cancelled",
		timerStarted: "🛡️ Urge Timer Started",
		timerStartedBody: "Target: 30 minutes. Stay strong!",
		victoryNotifTitle: "🎉 You did it!",
		victoryNotifBody: "You resisted the urge for 30 minutes!",
		cancelledNotifBody: "You lasted",
	},
	reminder: {
		notice: "🔔 Sobriety check-in time! How was today?",
		notifTitle: "🔔 Sobriety Check-in",
		notifBody: "Time for your daily check-in! How was today?",
		modalTitle: "🔔 Daily Check-in",
		modalMsg: "How was today?",
		okSuccess: "Successful ✓",
		okRelapse: "Relapse ✗",
		recorded: "✅ Check-in recorded! Current streak:",
		failed: "❌ Failed to record check-in.",
	},
	victory: {
		title: "You Did It!",
		subtitle: "You resisted the urge",
		timeInfo: "Stayed strong for",
		msg: "Every resistance reshapes your brain. You're not <strong>losing</strong> anything — you're <strong>winning</strong> yourself back.",
		msgStrong: "winning",
		quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
		quoteAuthor: "Viktor Frankl",
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
		refresh: "🔄 Refresh",
		successfulSuffix: "Successful",
		relapseSuffix: "Relapse",
	},
};

const zh: LangPack = {
	settings: {
		trackerFilePath: { name: "追踪文件路径", desc: "记录每日打卡和冲动日志的文件路径（相对于 vault 根目录）" },
		urgeTimerDuration: { name: "冲动计时时长", desc: "冲动计时器倒计时分钟数" },
		enableReminder: { name: "开启每日提醒", desc: "在指定时间弹出通知，提醒每日打卡" },
		reminderTime: { name: "提醒时间", desc: "每日打卡提醒时间" },
		language: { name: "语言", desc: "界面显示语言" },
	},
	urgeTimer: {
		confirmTitle: "💔 确认破戒",
		confirmMsg: "确定要破戒吗？",
		confirmOk: "确定破戒",
		confirmCancel: "继续坚持",
		heldStrong: "已坚持",
		noTimer: "⏹ 没有正在运行的计时器",
		timerCancelled: "💔 已取消",
		timerStarted: "🛡️ 冲动计时已启动",
		timerStartedBody: "目标 30 分钟，加油！",
		victoryNotifTitle: "🎉 你做到了！",
		victoryNotifBody: "你成功抵抗了冲动 30 分钟！",
		cancelledNotifBody: "你坚持了",
	},
	reminder: {
		notice: "🔔 戒色打卡时间！今天怎么样？",
		notifTitle: "🔔 戒色打卡提醒",
		notifBody: "到打卡时间了！今天情况如何？",
		modalTitle: "🔔 每日打卡",
		modalMsg: "今天怎么样？",
		okSuccess: "顺利 ✓",
		okRelapse: "破戒 ✗",
		recorded: "✅ 打卡已记录！当前连续天数：",
		failed: "❌ 打卡记录失败，请手动记录。",
	},
	victory: {
		title: "你做到了！",
		subtitle: "你抵抗了冲动",
		timeInfo: "坚持了",
		msg: "每一次抵抗都在重塑你的大脑。你不是在<strong>失去</strong>什么，而是在<strong>赢回</strong>自己。",
		msgStrong: "赢回",
		quote: "在刺激与回应之间，有一个空间。那个空间里，是我们选择回应的自由。",
		quoteAuthor: "——维克多·弗兰克尔",
	},
	dashboard: {
		title: "戒色仪表盘",
		dayStreak: "天连续",
		successRate: "成功率",
		totalDays: "总天数",
		successful: "顺利",
		relapses: "破戒",
		thisWeek: "本周",
		thisMonth: "本月",
		urgeLog: "冲动日志",
		wins: "获胜",
		recent: "最近记录",
		refresh: "🔄 刷新",
		successfulSuffix: "顺利",
		relapseSuffix: "破戒",
	},
};

export function getLang(lang: Lang): LangPack {
	return lang === "zh" ? zh : en;
}
