// Inspiration: https://www.youtube.com/watch?v=i6QXr62mb1g

// =============== WORK IN PROGRESS =======================

import { getScreen, addTemplate, el, div, clear } from "../../util/screens.js";
import { waitForKey, type } from "../../util/io.js";

async function typeLoading(text, options = { loadString: 3 }, container) {
	let typer = await type(text, {}, container);

	let span = el("span", typer);
	for (let i = 0; i < 3; i++) {
		await type(
			".".repeat(options.loadString),
			{
				initialWait: 100,
				useContainer: true
			},
			span
		);
		span.innerHTML = "";
	}
}

async function command() {
	clear();
	let screen = await getScreen("systemshock");

	div(screen, "triop");

	// await pause(5);
	await waitForKey();

	clear(screen);

	addTemplate("load", screen);

	await type("PCI Device listing.............", {}, screen);

	addTemplate("pci", screen, { wait: 3 });

	await waitForKey();

	return screen.remove();
}

const stylesheets = ["systemshock"];
const templates = ["systemshock"];
export { templates, stylesheets };
export default command;
