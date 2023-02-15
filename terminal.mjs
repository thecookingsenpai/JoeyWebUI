
import { type } from "./util/io.js";
import { power } from "./util/power.js";
import { toggleFullscreen } from "./util/screens.js";
import { registerHandlers, togglePower } from "./util/ui.mjs";

async function onLoad() {
	// Check for query parameters in the URL, e.g. ?command=help&fullscreen=1
	const urlParams = new URLSearchParams(window.location.search);
	const command = urlParams.get("command");
	const debugParam = urlParams.get("debug");
	const fullscreen = urlParams.get("fullscreen");

	// Set up click event handlers for UI buttons
	registerHandlers();

	if(fullscreen) {
		toggleFullscreen(true);
	}

	// If a command is passed in the URL, execute that immediately
	if (command || debugParam) {
		run(command, debugParam)
	}

	
	//togglePower();
}

async function run(command, debug) {
	const { power } = await import("./util/power.js");
	const { parse } = await import("./util/io.js");

	// Turns on the screen
	power(true);

	// Run the command (setting debug param will skip typing the command)
	if (command) {
		if (!debug) {
			await type("> " + command, { initialWait: 3000, finalWait: 1500 });
		}
		await parse(command);
	}

	// After the command is finished, show the main terminal
	const { main } = await import("./util/screens.js");
	main();
}

window.addEventListener("load", onLoad);