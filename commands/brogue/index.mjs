
import { getScreen, showTemplateScreen, addTemplate, clear } from "../../util/screens.js";
import { type, waitForKey } from "../../util/io.js";
import say from "../../util/speak.js";
import alert from "../../util/alert.js";
import pause from "../../util/pause.js";

import Game from './game.mjs';

const output = [
	"Loading...",
	"   ",
	"Textures......................... OK",
	"Character models................. OK",
	"Generating dungeon............... OK"
];

async function brogue() {
	clear();
	say("BROGUE", 0.5, 0.8);
	return new Promise(async resolve => {
		// LOGO
		let logoScreen = await showTemplateScreen("logo");
		pause(2);

		await waitForKey();
		logoScreen.remove();

		// INTRO
		let introScreen = await showTemplateScreen("intro");
		await waitForKey();
		introScreen.remove();

		// Main game screen
		let gameScreen = getScreen("rogue");

		// Create the output for messages
		let output = document.createElement("div");
		output.classList.add("output");
		gameScreen.appendChild(output);

		addTemplate("layout", gameScreen);
		
		let body = getComputedStyle(document.body);
		let settings = {
			container: document.querySelector(".layout .mid"),
			fg: body.getPropertyValue("--color"),
			wall: body.getPropertyValue("--bg"),
			bg: body.getPropertyValue("--off"),
			fontSize: 24,
			width: 10,
			height: 10,
			forceSquareRatio: true, // display is buggy without this?
			onQuit: () => {
				gameScreen.remove();
				resolve();
			},
			onMessage: async (txt) => {
				output.innerHTML = "";
				await type(txt, { initialWait: 0 }, output);
				await pause(2);
				output.innerHTML = "";
			},
			onAlert: async (txt) => {
				say(txt);
				await alert(txt);
			}
		};

		new Game(settings);
	});
}

const templates = ["brogue"];

export default brogue;
export { output, templates };
