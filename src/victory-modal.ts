import { App, Modal } from "obsidian";

export class VictoryModal extends Modal {
	private durationMinutes: number;

	constructor(app: App, durationMinutes: number) {
		super(app);
		this.durationMinutes = durationMinutes;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("sobriety-victory-modal");

		const now = new Date();
		const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

		contentEl.createDiv({ cls: "badge", text: "🎖" });
		contentEl.createEl("h2", { text: "You Did It!" });
		contentEl.createDiv({ cls: "subtitle", text: "You resisted the urge" });
		contentEl.createDiv({ cls: "time-info", text: `${timeStr} · Stayed strong for ${this.durationMinutes} minutes` });

		const msg = contentEl.createDiv({ cls: "message" });
		msg.innerHTML = `
			Every resistance reshapes your brain.<br>
			You're not <strong>losing</strong> anything — you're <strong>winning</strong> yourself back.<br><br>
			The urge was just passing through. You are the one in control.
		`;

		const quote = contentEl.createDiv({ cls: "quote" });
		quote.innerHTML = `
			&ldquo;Between stimulus and response there is a space.<br>
			In that space is our power to choose our response.&rdquo;<br>
			&mdash; Viktor Frankl
		`;

		// Launch confetti
		this.launchConfetti();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	private launchConfetti(): void {
		const colors = ["#f7d94e", "#f5a623", "#ff6b6b", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"];

		for (let i = 0; i < 60; i++) {
			const el = document.createElement("div");
			el.addClass("sobriety-confetti");
			el.style.left = Math.random() * 100 + "%";
			el.style.width = (6 + Math.random() * 8) + "px";
			el.style.height = (6 + Math.random() * 8) + "px";
			el.style.background = colors[Math.floor(Math.random() * colors.length)];
			el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
			el.style.animationDuration = (2 + Math.random() * 3) + "s";
			el.style.animationDelay = Math.random() * 2 + "s";

			document.body.appendChild(el);

			// Remove after animation
			setTimeout(() => {
				if (el.parentNode) el.parentNode.removeChild(el);
			}, 6000);
		}
	}
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}
