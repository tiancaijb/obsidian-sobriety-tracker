import { App, TFile, normalizePath } from "obsidian";

/**
 * Ensure the tracker file exists, creating it with a header if not.
 */
export async function ensureTrackerFile(app: App, path: string): Promise<TFile> {
	const normalized = normalizePath(path);
	let file = app.vault.getAbstractFileByPath(normalized);
	if (file instanceof TFile) return file;

	// Create new file (Obsidian uses filename as title, no H1 needed)
	const header = `## Daily Check-ins\n\n## Urge Log\n\n`;
	file = await app.vault.create(normalized, header);
	return file as TFile;
}

/**
 * Append a daily check-in entry.
 */
export async function logDailyCheckin(
	app: App,
	path: string,
	status: "success" | "relapse",
	note: string = ""
): Promise<void> {
	const file = await ensureTrackerFile(app, path);
	const today = new Date();
	const dateStr = formatDate(today);
	const entry = `- ${dateStr}${note ? " — " + note : ""} ${status === "success" ? "✓" : "✗"}\n`;

	let content = await app.vault.read(file);
	const sectionMarker = "## Daily Check-ins";

	const insertPos = content.indexOf(sectionMarker);
	if (insertPos === -1) {
		// Section not found, append to end
		content += `\n## Daily Check-ins\n${entry}`;
	} else {
		// Insert after the section heading, before the next section or end
		const afterSection = content.slice(insertPos + sectionMarker.length);
		const nextSection = afterSection.search(/\n## /);
		const insertAt = nextSection === -1
			? content.length
			: insertPos + sectionMarker.length + nextSection;
		content = content.slice(0, insertAt) + "\n" + entry + content.slice(insertAt);
	}

	await app.vault.modify(file, content);
}

/**
 * Log an urge event (victory or relapse).
 */
export async function logUrgeEvent(
	app: App,
	path: string,
	victory: boolean,
	durationMinutes: number,
	note: string = ""
): Promise<void> {
	const file = await ensureTrackerFile(app, path);
	const now = new Date();
	const dateStr = formatDate(now);
	const timeStr = formatTime(now);
	const weekday = formatWeekday(now);

	const entry = victory
		? `- ${dateStr} ${timeStr} ✓ Urge resisted, stayed strong for ${durationMinutes} min\n`
		: `- ${dateStr} ${timeStr} ✗ Relapse${note ? " (" + note + ")" : ""}\n`;

	let content = await app.vault.read(file);
	const sectionMarker = "## Urge Log";

	const insertPos = content.indexOf(sectionMarker);
	if (insertPos === -1) {
		content += `\n## Urge Log\n${entry}`;
	} else {
		const afterSection = content.slice(insertPos + sectionMarker.length);
		const nextSection = afterSection.search(/\n## /);
		const insertAt = nextSection === -1
			? content.length
			: insertPos + sectionMarker.length + nextSection;
		content = content.slice(0, insertAt) + "\n" + entry + content.slice(insertAt);
	}

	await app.vault.modify(file, content);
}

/**
 * Calculate current streak in days (consecutive successful check-ins).
 */
export async function getStreak(app: App, path: string): Promise<number> {
	const file = app.vault.getAbstractFileByPath(normalizePath(path));
	if (!(file instanceof TFile)) return 0;

	const content = await app.vault.read(file);

	// Parse daily check-ins section
	const checkinMatch = content.match(/## Daily Check-ins\n([\s\S]*?)(?:\n## |$)/);
	if (!checkinMatch) return 0;

	const entries = checkinMatch[1]
		.split("\n")
		.map(l => l.trim())
		.filter(l => /^- \d{4}-\d{2}-\d{2}/.test(l));

	if (entries.length === 0) return 0;

	// Walk backwards from today counting consecutive successes
	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	for (let i = entries.length - 1; i >= 0; i--) {
		const match = entries[i].match(/^- (\d{4}-\d{2}-\d{2})/);
		if (!match) break;

		const isChecked = entries[i].includes("✓");
		if (!isChecked) break; // Break streak on first unchecked
		if (!isChecked) break; // Break streak on first unchecked

		const entryDate = new Date(match[2] + "T00:00:00");
		const expectedDate = new Date(today);
		expectedDate.setDate(expectedDate.getDate() - (entries.length - 1 - i));

		// Allow entries to be in order; count consecutive checked items
		streak++;
	}

	return streak;
}

function formatDate(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatWeekday(d: Date): string {
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	return days[d.getDay()];
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}
