import { App, Modal, sanitizeHTMLToDom } from "obsidian";
import { VictoryPack } from "./lang";

export class VictoryModal extends Modal {
	private durationMinutes: number;
	private L: VictoryPack;

	constructor(app: App, durationMinutes: number, langPack: VictoryPack) {
		super(app);
		this.durationMinutes = durationMinutes;
		this.L = langPack;
	}

	onOpen(): void {
		const { contentEl } = this;
		const L = this.L;
		contentEl.addClass("sobriety-victory-modal");

		const now = new Date();
		const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

		contentEl.createDiv({ cls: "badge", text: "🎖" });
		contentEl.createEl("h2", { text: L.title });
		contentEl.createDiv({ cls: "subtitle", text: L.subtitle });
		contentEl.createDiv({ cls: "time-info", text: `${timeStr} · ${L.timeInfo} ${this.durationMinutes} min` });

		const msg = contentEl.createDiv({ cls: "message" });
		msg.appendChild(sanitizeHTMLToDom(L.msg));

		const quote = contentEl.createDiv({ cls: "quote" });
		const quoteHtml = `&ldquo;${L.quote}&rdquo;<br>&mdash; ${L.quoteAuthor}`;
		quote.appendChild(sanitizeHTMLToDom(quoteHtml));

		this.launchConfetti();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private launchConfetti(): void {
		const colors = ["#f7d94e", "#f5a623", "#ff6b6b", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"];
		for (let i = 0; i < 60; i++) {
			const el = activeDocument.createElement("div");
			el.addClass("sobriety-confetti");
			el.setCssProps({
				left: Math.random() * 100 + "%",
				width: (6 + Math.random() * 8) + "px",
				height: (6 + Math.random() * 8) + "px",
				background: colors[Math.floor(Math.random() * colors.length)],
				borderRadius: Math.random() > 0.5 ? "50%" : "2px",
				animationDuration: (2 + Math.random() * 3) + "s",
				animationDelay: Math.random() * 2 + "s",
			});
			activeDocument.body.appendChild(el);
			window.setTimeout(() => el.parentNode?.removeChild(el), 6000);
		}
	}
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}
