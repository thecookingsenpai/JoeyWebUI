import { addTemplate, el, getScreen } from "../../util/screens.js";
import { type } from "../../util/io.js";
import { typeSound } from "../../sound/index.js";
import { rnd, generateText, nextHex } from './util.mjs';

const MAX_LIVES = 4;
const ROWS = 2 * 17; // Rows in the cypher text
const CHARS_PER_ROW = 12; // Number of characters per row

// Fast config for the typer
const FAST = {
	wait: 15,
	initialWait: 100
};

// Globals
let activeWord;
let wordLength = 5;
let activeElement = null;

// Returns a group of sibling spans that belong to the same word if they have data-word or data-special attr.
// Otherwise returns a single span.
function getActiveSpans(el) {
	let wordSpans = [el];

	// Get the data from the selected  character
	let { word, special } = el.dataset;
	if (word) {
		wordSpans = [...document.querySelectorAll(`[data-word="${word}"`)];
	} else if (special) {
		wordSpans = [
			...document.querySelectorAll(`[data-special="${special}"`)
		];
	}

	return wordSpans;
}

function charToSpan(char) {
	let span = document.createElement("span");
	span.innerText = char.text;

	if (char.nr !== undefined) {
		span.dataset.word = char.nr;
		span.dataset.password = true;
	}

	if (char.special !== undefined) {
		span.dataset.special = char.special;
	}

	if (!activeElement) {
		activeElement = span;
		span.classList.add("active");
	}
	return span;
}

// Callback for highlighting an element, and possible its related elements, if it
// is part of a word or special. Types the hovered char/word in the bottom right.
function focusElement(target) {
	typeSound();
	let spans = getActiveSpans(activeElement);

	spans.forEach(span => span.classList.remove("active"));
	activeElement = target;
	spans = getActiveSpans(target);

	let wordNr = target.dataset.word;

	let activeWordText = "";
	spans.forEach(span => {
		span.classList.add("active");
		activeWordText += span.textContent;
	});

	if (!wordNr || wordNr !== activeWord) {
		let active = document.querySelector(".active-word");
		active.textContent = "";
		type(
			activeWordText,
			{ initialWait: 0, useContainer: false, stopBlinking: false },
			active
		);
	}

	activeWord = wordNr;
}

function handleWordHover(event) {
	focusElement(event.target);
}

function handleWordOut(event) {
	let target = event.target;
	let spans = getActiveSpans(target);
	spans.forEach(span => span.classList.remove("active"));
}

// Game renders the hacking game screen and calls outro() on correct password
function Game({onQuit}) {
    this.onQuit = onQuit;
    this.container = getScreen('fallout');

    this.lives = MAX_LIVES;
    this.start();
}

Game.prototype.handleKey = function(e) {
	e.preventDefault();
	let nextElement;
	let row = activeElement.parentNode;
	let rows = Array.from(row.parentNode.children);
	let elementIndex = Array.from(row.children).indexOf(activeElement);
	let rowNr = rows.indexOf(row);

	// up arrow
	if (e.keyCode === 38) {
		if (rows[rowNr - 1]) {
			nextElement = rows[rowNr - 1].childNodes[elementIndex];
		}
	}
	// down arrow
	else if (e.keyCode === 40) {
		if (rows[rowNr + 1]) {
			nextElement = rows[rowNr + 1].childNodes[elementIndex];
		}
	}
	// left arrow
	else if (e.keyCode === 37) {
		let prevRow = rows[rowNr - 17];
		if (activeElement.previousElementSibling) {
			nextElement = activeElement.previousElementSibling;
		} else if (prevRow) {
			nextElement = prevRow.childNodes[prevRow.childNodes.length - 1];
		}
	}
	// right arrow
	else if (e.keyCode === 39) {
		if (activeElement.dataset.word) {
			let list = row.querySelectorAll(
				`[data-word="${activeElement.dataset.word}"]`
			);
			activeElement = list.item(list.length - 1);
		} else if (activeElement.dataset.special) {
			let list = row.querySelectorAll(
				`[data-special="${activeElement.dataset.special}"]`
			);
			activeElement = list.item(list.length - 1);
		}

		if (activeElement.nextElementSibling) {
			nextElement = activeElement.nextElementSibling;
		} else if (rows[rowNr + 17]) {
			nextElement = rows[rowNr + 17].childNodes[0];
		}
	}
	// enter
	else if (e.keyCode === 13) {
		if (activeElement.dataset.word) {
			this.handlePassword(activeElement);
		} else if (activeElement.dataset.special) {
			this.handleSpecial(activeElement);
		}
	}

	if (nextElement) {
		focusElement(nextElement);
	}
}

// Clicking a special group either removes a dud password,
// or resets the lives to the maximum. Then it disables
// the special from further use.
Game.prototype.handleSpecial = function(target) {
	let output = document.querySelector(".output");
	let active = output.querySelector(".active-word");

	let special = target.dataset.special;
	let specs = [...document.querySelectorAll(`[data-special="${special}"]`)];

	let specialText = specs.map(s => s.textContent).join("");

	let pre = document.createElement("pre");
	if (Math.random() < 0.66 || this.lives === MAX_LIVES) {
		let pwIndex = this.selectedWords.indexOf(this.password);
		let duds = [...document.querySelectorAll(`[data-word]`)].filter(
			e => e.dataset.word !== pwIndex
		);

		let dudNr = duds[rnd(duds.length)].dataset.word;

		// Disable the dud letters
		let dudSpans = [...document.querySelectorAll(`[data-word="${dudNr}"]`)];
		dudSpans.forEach(span => {
			delete span.dataset.word;
			span.textContent = ".";
		});

		pre.textContent = `>${specialText}
>Dud removed.`;
	} else {
		this.lives = MAX_LIVES;
		pre.textContent = `>${specialText}
>Tries reset.`;

		this.updateLives();
	}

	output.insertBefore(pre, active);

	// Disable the clicked special
	specs.forEach(s => {
		s.classList.remove("active");
		delete s.dataset.special;
	});
}

// Shows feedback for the error, subtracts a life.
// If no lives are left, the terminal is locked.
Game.prototype.error = async function(pw) {
	this.lives -= 1;

	if (this.lives === 0) {
		return this.quit(false);
	}

	let output = document.querySelector(".output");

	let active = output.querySelector(".active-word");
	let pre = document.createElement("pre");

	let likeness = pw
		.split("")
		.reduce((total, c, i) => (total += Number(c === this.password[i])), 0);

	pre.textContent = `>${pw}
>Entry denied
>Likeness=${likeness}`;

	output.insertBefore(pre, active);

	this.updateLives();
}

// Updates the text indicator for number of lives based on the lives variable.
Game.prototype.updateLives = async function() {
	let span = document.querySelector(".lives");

	let blocks = Array(this.lives)
		.fill(0)
		.map(() => "■ ")
		.join("");
	await type(`Attempts remaining: ${blocks}`, { clearContainer: true }, span);
}

Game.prototype.quit = function(win) {   
    this.container.remove();
    this.onQuit(win);
}

// If pw is correct, clean up the screen, otherwise call error function
Game.prototype.handlePassword = function(target) {
	let wordNr = target.dataset.word;
	let pw = this.selectedWords[wordNr];

	if (pw === this.password) {
        this.quit(true);
	} else {
		this.error(pw);
	}
}

Game.prototype.start = async function() {
    
    await type(
        ["Welcome to ROBCO Industries (TM) Termlink", "Password Required"],
        FAST,
        this.container
    );

    // Get list of words
    let words = await fetch("../util/words.txt").then(res => res.text());
    words = words.split(" ");

    // Get arrays of words of the same length, the object is indexed by word length
    let wordBucket = {};
    words.forEach(word => {
        wordBucket[word.length] = wordBucket[word.length]
            ? [...wordBucket[word.length], word]
            : [word];
    });

    // Setup the hacking screen
    await addTemplate("hacking", this.container);

    await this.updateLives();

    let {output: text, selectedWords, password} = generateText(wordBucket[wordLength], wordLength, ROWS * CHARS_PER_ROW);
    this.selectedWords = selectedWords;
    this.password = password;

    let cypher = this.container.querySelector(".cypher");

    // Show the cypher text on screen, line by line
    for (let rowNr = 0; rowNr < ROWS; rowNr++) {
        let row = document.createElement("div");
        row.classList.add("row");

        // Get the next batch of characters to print
        let chars = text
            .slice(
                rowNr * CHARS_PER_ROW,
                rowNr * CHARS_PER_ROW + CHARS_PER_ROW
            )
            .map(charToSpan);

        cypher.appendChild(row);
        await type(
            [nextHex(), ...chars],
            {
                wait: 10,
                initialWait: 0,
                finalWait: 0,
                useContainer: true,
                processChars: false
            },
            row
        );
        // for debugging:
        // [nextHex(), ...chars].forEach(e => row.appendChild(e));
    }

    // Create a <span> for the highlighted word
    el('span', document.querySelector('.output'), 'active-word');

    // Hover listeners for all words
    let wordSpans = [...cypher.querySelectorAll("span")];
    wordSpans.forEach(wordSpan => {
        wordSpan.addEventListener("mouseenter", handleWordHover);
        wordSpan.addEventListener("mouseleave", handleWordOut);
    });

    // Click listeners for passwords
    let passwords = [...cypher.querySelectorAll("[data-password]")];
    passwords.forEach(pw => {
        pw.addEventListener("click", event =>
            this.handlePassword(event.target)
        );
    });

    // Click listeners for specials
    let specials = [...cypher.querySelectorAll("[data-special]")];
    specials.forEach(special => {
        special.addEventListener("click", event =>
            this.handleSpecial(event.target)
        );
    });

    cypher.addEventListener("keydown", (e) => this.handleKey(e));
    cypher.focus();
}

export default Game;