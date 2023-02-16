import { parse, type, prompt, input } from "./io.js";
import pause from "./pause.js";
import alert from "./alert.js";
import say from "./speak.js";

var USER = "Human";

/** Boot screen */
async function boot() {
	clear();

	await type("Loading JOEY 0.1...", {
		initialWait: 1000
	});
	if(OpenAI) {
		await type("AI Model Loaded.");
	} else {
		await type("AI Model Failed to Load. Sorry.");
		return;
	}
	return login();
}

/** Login screen */
async function login() {
	//clear();
	USER = await prompt("Please introduce yourself.");
	//let password = await prompt("Password:", true);
	await type("Logging in...");
	// Check if in local storage we have an api key 
	let openai_key = localStorage.getItem("openai_key");
	if(!openai_key) {
		// REVIEW - Probably the 2nd argument shouldn't be necessary (lower) anymore
		openai_key = await prompt("Please enter your OpenAI API key.", false);
		console.log(openai_key);
		localStorage.setItem("openai_key", openai_key);
	}
	say("CREDENTIALS SAVED LOCALLY.");
	await alert("Welcome " + USER);
	// Initialize the prompt with the user's name
    let firstCompletion = await joey_init(USER, openai_key);
	clear();
	// Print the first completion
	await type("Joey > "  + firstCompletion);
	return main();
}

/** Main input terminal, recursively calls itself */
async function main() {
	let command = await input(USER);
	try {
		await parse(command);
	} catch (e) {
		if (e.message) await type(e.message);
	}

	main();
}

function addClasses(el, ...cls) {
	let list = [...cls].filter(Boolean);
	el.classList.add(...list);
}

function getScreen(...cls) {
	let div = document.createElement("div");
	addClasses(div, "fullscreen", ...cls);
	document.querySelector("#crt").appendChild(div);
	return div;
}

function toggleFullscreen(isFullscreen) {
	document.body.classList.toggle("fullscreen", isFullscreen);
}

/** Attempts to load template HTML from the given path and includes them in the <head>. */
async function loadTemplates(path) {
	let txt = await fetch(path).then((res) => res.text());
	let html = new DOMParser().parseFromString(txt, "text/html");
	let templates = html.querySelectorAll("template");

	templates.forEach((template) => {
		document.head.appendChild(template);
	});
}

/** Clones the template and adds it to the container. */
async function addTemplate(id, container, options = {}) {
	let template = document.querySelector(`template#${id}`);
	if (!template) {
		throw Error("Template not found");
	}
	// Clone is the document fragment of the template
	let clone = document.importNode(template.content, true);

	if (template.dataset.type) {
		await type(clone.textContent, options, container);
	} else {
		container.appendChild(clone);
	}

	// We cannot return clone here
	// https://stackoverflow.com/questions/27945721/how-to-clone-and-modify-from-html5-template-tag
	return container.childNodes;
}

/** Creates a new screen and loads the given template into it. */
async function showTemplateScreen(id) {
	let screen = getScreen(id);
	await addTemplate(id, screen);
	return screen;
}

/**
 * Creates an element and adds it to the given container (or terminal screen if undefined).
 * @param {String} type The type of element to create.
 * @param {Element} container The container to add the created element to.
 * @param {String} cls The class to apply to the created element.
 * @param {Object} attrs Extra attributes to set on the element.
 */
function el(
	type,
	container = document.querySelector(".terminal"),
	cls = "",
	attrs
) {
	let el = document.createElement(type);
	addClasses(el, cls);

	container.appendChild(el);

	if (attrs) {
		Object.entries(attrs).forEach(([key, value]) => {
			el.setAttribute(key, value);
		});
	}
	return el;
}

/**
 * Creates a <div> and adds it to the screen.
 * @param {Element} container The container to add the created element to.
 * @param {String} cls The class to apply to the created element.
 */
function div(...args) {
	return el("div", ...args);
}

function clear(screen = document.querySelector(".terminal")) {
	screen.innerHTML = "";
}

export {
	boot,
	login,
	main,
	clear,
	getScreen,
	toggleFullscreen,
	div,
	el,
	loadTemplates,
	addTemplate,
	showTemplateScreen
};
