import shuffle from "../../util/shuffle.js";

const CHARS = `!@#$%^&*()-_[]{}<>\\|'";:/?,.`;

let hex = rnd(0xf000) + 0x0c00;

// Random number between 0 and max
function rnd(max) {
	return Math.floor(Math.random() * max);
}

function getChars(word, nr) {
	return word.split("").map(text => ({ text, nr }));
}

function getGarble(length) {
	return Array(length)
		.fill(0)
		.map(() => ({
			text: CHARS[rnd(CHARS.length)]
		}));
}

function getSpecial(length, nr) {
	let open;
	let close;

	let r = Math.random();
	if (r < 0.3) {
		open = "[";
		close = "]";
	} else if (r < 0.6) {
		open = "<";
		close = ">";
	} else {
		open = "(";
		close = ")";
	}

	// -2 for open and close char, with minimum of 1 random
	let garble = getGarble(Math.max(length - 2, 1));
	return [{ text: open }, ...garble, { text: close }].map(s => ({
		...s,
		special: nr
	}));
}

// Adds a random amount between 1 and 7 to the global hex variable and returns the new hex string
function nextHex() {
	let next = document.createElement("span");
	hex += rnd(6) + 1;
	next.textContent = `0x${hex.toString(16).toUpperCase()} `;
	return next;
}

// Generates an array of objects, consisting of random punctuation characters,
// passwords and specials up to the maximum character count. A special can be clicked
// once to remove a dud password or reset the lives.
// These objects can easily be formatted and converted to DOM elements.
// A returned object contains:
// - text: character to display on screen
// - nr: (optional) password number in the list of possible words
// - special: (optional) number of in the list of all specials.
function generateText(words, length, maxLength) {
    let output = [];
    let selectedWords = [];
	let wordCount = 0;
    let specialCount = 0;
    const MAX = maxLength;

    words = shuffle(words);
    
	while (output.length < MAX) {
		let diff = MAX - output.length;
		// First generate some garble
		let garble = Math.min(diff, rnd(15) + 15 - length);

		output = [...output, ...getGarble(garble)];

		// Then, generate either a special (small chance) or a password
		if (Math.random() < 0.3) {
			let specialLength = rnd(6) + 3;
			if (output.length + specialLength < MAX) {
				output = [
					...output,
					...getSpecial(specialLength, specialCount)
				];
				specialCount++;
			}
		} else {
			// Get the next password
			let word = words[wordCount];
			// Only add a word if it fits
			if (output.length + word.length < MAX) {
				selectedWords = [...selectedWords, word];
				let chars = getChars(word, wordCount);
				output = [...output, ...chars];
				wordCount++;
			}
		}
	}

	// The correct password is one of the selected words
	let password = selectedWords[rnd(selectedWords.length - 1)];

	return {output, selectedWords, password};
}

export { rnd, getChars, getSpecial, getGarble, nextHex, generateText };