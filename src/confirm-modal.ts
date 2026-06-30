import { App, Modal, Setting } from "obsidian";

/**
 * Show a simple confirmation modal. Returns true if user clicked "OK".
 */
export function showConfirmModal(
	app: App,
	title: string,
	message: string,
	okText: string = "OK",
	cancelText: string = "Cancel"
): Promise<boolean> {
	return new Promise((resolve) => {
		const modal = new Modal(app);
		modal.titleEl.setText(title);

		modal.contentEl.createEl("p", { text: message });

		const btnDiv = modal.contentEl.createDiv();
		btnDiv.style.display = "flex";
		btnDiv.style.gap = "12px";
		btnDiv.style.justifyContent = "center";
		btnDiv.style.marginTop = "16px";

		new Setting(btnDiv)
			.addButton((btn) =>
				btn
					.setButtonText(cancelText)
					.onClick(() => {
						modal.close();
						resolve(false);
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText(okText)
					.setCta()
					.onClick(() => {
						modal.close();
						resolve(true);
					})
			);

		modal.open();
	});
}
