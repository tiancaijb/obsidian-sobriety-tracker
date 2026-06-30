import { App, TFile, normalizePath } from "obsidian";

export interface SobrietyStats {
	streak: number;
	totalSuccess: number;
	totalRelapse: number;
	totalUrgeWins: number;
	totalUrgeRelapses: number;
	successRate: number;
	totalDays: number;
	weekSuccess: number;
	weekRelapse: number;
	monthSuccess: number;
	monthRelapse: number;
	last7Entries: { date: string; success: boolean }[];
}

/**
 * Parse all stats from the tracker file.
 */
export async function computeStats(app: App, path: string): Promise<SobrietyStats> {
	const file = app.vault.getAbstractFileByPath(normalizePath(path));
	if (!(file instanceof TFile)) return emptyStats();

	const content = await app.vault.read(file);

	const dailyEntries = parseDailyCheckins(content);
	const urgeEntries = parseUrgeLog(content);

	const now = new Date();
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

	// Compute streak and counts from daily entries (sorted newest first)
	const sorted = [...dailyEntries].sort((a, b) => b.date.getTime() - a.date.getTime());
	for (const entry of sorted) {
		if (entry.success) {
			totalSuccess++;
			if (streak === 0) {
				// Check if this entry is today or yesterday (streak is contiguous)
				const diff = Math.round((today.getTime() - entry.date.getTime()) / 86400000);
				if (diff <= 1) streak++;
				else break; // gap, streak broken
			} else {
				streak++;
			}
		} else {
			totalRelapse++;
			streak = 0; // break streak on relapse
		}

		if (entry.date >= weekStart) {
			if (entry.success) weekSuccess++; else weekRelapse++;
		}
		if (entry.date >= monthStart) {
			if (entry.success) monthSuccess++; else monthRelapse++;
		}
	}

	const totalUrgeWins = urgeEntries.filter(e => e.success).length;
	const totalUrgeRelapses = urgeEntries.filter(e => !e.success).length;
	const totalDays = totalSuccess + totalRelapse;
	const successRate = totalDays > 0 ? Math.round((totalSuccess / totalDays) * 100) : 0;

	// Last 7 entries for display
	const last7Entries = sorted.slice(0, 7).map(e => ({
		date: formatDate(e.date),
		success: e.success,
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
		last7Entries,
	};
}

interface DailyEntry {
	date: Date;
	success: boolean;
}

interface UrgeEntry {
	date: Date;
	success: boolean;
}

function parseDailyCheckins(content: string): DailyEntry[] {
	const section = content.match(/## Daily Check-ins\n([\s\S]*?)(?:\n## |$)/);
	if (!section) return [];

	return section[1]
		.split("\n")
		.map(l => l.trim())
		.filter(l => l.startsWith("- "))
		.map(l => {
			const dateMatch = l.match(/(\d{4}-\d{2}-\d{2})/);
			if (!dateMatch) return null;
			const success = l.includes("✓");
			return { date: new Date(dateMatch[1] + "T00:00:00"), success };
		})
		.filter((e): e is DailyEntry => e !== null);
}

function parseUrgeLog(content: string): UrgeEntry[] {
	const section = content.match(/## Urge Log\n([\s\S]*?)(?:\n## |$)/);
	if (!section) return [];

	return section[1]
		.split("\n")
		.map(l => l.trim())
		.filter(l => l.startsWith("- "))
		.map(l => {
			const success = l.includes("✓");
			return { date: new Date(), success };
		});
}

function emptyStats(): SobrietyStats {
	return {
		streak: 0, totalSuccess: 0, totalRelapse: 0,
		totalUrgeWins: 0, totalUrgeRelapses: 0,
		successRate: 0, totalDays: 0,
		weekSuccess: 0, weekRelapse: 0,
		monthSuccess: 0, monthRelapse: 0,
		last7Entries: [],
	};
}

function formatDate(d: Date): string {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${day}`;
}
