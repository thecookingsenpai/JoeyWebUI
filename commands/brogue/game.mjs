const ROT = window.ROT;

const nope = () => {
	let answers = [
		"This box is empty :-(",
		"Nope",
		"Nada",
		"Bogus",
		"Keep looking!"
	];

	return answers[Math.floor(Math.random() * answers.length)];
};

/*
 * Maps the event keyCode to Rot direction.
 * The directions are clockwise, starting at the top:
 *
 * +------------+
 * | 7 | 0 | 1 |
 * +------------+
 * | 6 | . | 2 |
 * +------------+
 * | 5 | 4 | 3 |
 * +------------+
 */

const keyMap = {
	38: 0,
	33: 1,
	39: 2,
	34: 3,
	40: 4,
	35: 5,
	37: 6,
	36: 7
};

const WALL = "▦";
const CLEAR = " ";
const BOX = "▣";
const EMPTY_BOX = "□";

class Player {
	_x = null;
	_y = null;
	_game = null;

	constructor(game, x, y) {
		this._x = x;
		this._y = y;
		this.game = game;

		this.game.message("Find the pizza, Bro!");

		document
			.querySelector(".up")
			.addEventListener("click", () => this.move(0, -1));
		document
			.querySelector(".right")
			.addEventListener("click", () => this.move(1, 0));
		document
			.querySelector(".left")
			.addEventListener("click", () => this.move(-1, 0));
		document
			.querySelector(".down")
			.addEventListener("click", () => this.move(0, 1));

		document
			.querySelector(".mid")
			.addEventListener("click", () => this._checkBox());
	}

	// _draw() {
	// 	this.game.display.draw(this._x, this._y, "D", "#ff0");
	// }

	act() {
		this.game.engine.lock();
		/* wait for user input; do stuff when user hits a key */
		window.addEventListener("keydown", this.handleEvent);
	}

	get key() {
		return this._x + "," + this._y;
	}

	get coords() {
		return [this._x, this._y];
	}

	handleEvent = event => {
		let code = event.keyCode;
		if (code === 32) {
			// Space
			this._checkBox();
			return;
		} else if (code === 81 || code === 27) {
			// Q or ESC
			this.game.quit();
			return;
		}

		if (!(code in keyMap)) {
			return;
		}

		event.preventDefault();
		// Turn ended: remove listener
		window.removeEventListener("keydown", this.handleEvent);

		let [dx, dy] = ROT.DIRS[8][keyMap[code]];
		this.move(dx, dy);

		this.game.engine.unlock();
	};

	move(dx, dy) {
		let newX = this._x + dx;
		let newY = this._y + dy;

		let newKey = newX + "," + newY;

		// Check if new spot is free
		if (!(newKey in this.game.map)) {
			return;
		}
		// Draw new position using player data
		this._x = newX;
		this._y = newY;
		// this._draw();
		this.game._drawWholeMap();
		this.game.updateControls();
	}

	async _checkBox() {
		let key = this.key;

		if (key === this.game.ananas) {
			this.game.engine.lock();
			window.removeEventListener("keydown", this.handleEvent);

      await this.game.alert("A winner is you!");
			this.game.quit();
		} else if (this.game.map[key] === BOX) {
			this.game.message(nope());
			this.game.map[key] = EMPTY_BOX;
		} else {
			this.game.message("Nothing here...");
		}
	}
}

class Pedro {
	constructor(game, x, y) {
		this.game = game;
		this._x = x;
		this._y = y;
	}

	// _draw() {
	// 	this.game.display.draw(this._x, this._y, "P", "red");
	// }

	get coords() {
		return [this._x, this._y];
	}

	async act() {
		let [x, y] = this.game.player.coords;

		let passableCallback = (x, y) => {
			return x + "," + y in this.game.map;
		};
		let astar = new ROT.Path.AStar(x, y, passableCallback, { topology: 4 });

		let path = [];
		let pathCallback = function(x, y) {
			path.push([x, y]);
		};
		astar.compute(this._x, this._y, pathCallback);

		path.shift(); /* remove Pedro's position */
		if (path.length === 1) {
      this.game.engine.lock();
      await this.game.alert("Oh dear, you died!");
			this.game.quit();
		}
		// Only move half the time
		else if (Math.random() > 0.5) {
			x = path[0][0];
			y = path[0][1];
			this._x = x;
			this._y = y;
		}
	}
}

class Game {
	map = {};
	walls = {};
	display = null;
	player = null;
	pedro = null;
	ananas = null;

	mapWidth = 100;
	mapHeight = 100;

	constructor(settings = {}) {

		this.settings = settings;

		// Create the ROT display
		this.display = new ROT.Display({
			fontFamily: "VT323",
			...settings
		});

		this._generateMap();

		// Turn scheduler
		let scheduler = new ROT.Scheduler.Simple();
		scheduler.add(this.player, true);
		scheduler.add(this.pedro, true);
		this.engine = new ROT.Engine(scheduler);
		this.engine.start();

		// Show game
		let canvas = this.display.getContainer();
		canvas.classList.add("game");
		settings.container.appendChild(canvas);
		this.updateControls();
	}

	async message(text) {
		return await this.settings.onMessage(text);
  }
  
  async alert(text) {
    return await this.settings.onAlert(text);
  }

	quit() {
		this.settings.onQuit();
	}

	isWall(x, y) {
		return this.walls[x + "," + y] === WALL;
	}

	updateControls() {
		let [px, py] = this.player.coords;

		document
			.querySelector(".up")
			.toggleAttribute("disabled", this.isWall(px, py - 1));
		document
			.querySelector(".down")
			.toggleAttribute("disabled", this.isWall(px, py + 1));
		document
			.querySelector(".left")
			.toggleAttribute("disabled", this.isWall(px - 1, py));
		document
			.querySelector(".right")
			.toggleAttribute("disabled", this.isWall(px + 1, py));
	}
	_generateMap() {
		let digger = new ROT.Map.Digger();

		let freeCells = [];

		let digCallback = (x, y, isWall) => {
			let key = x + "," + y;
			if (isWall) {
				this.walls[key] = WALL;
			} else {
				freeCells.push(key);
				this.map[key] = CLEAR;
			}
		};
		digger.create(digCallback.bind(this));

		this._generateBoxes(freeCells);

		this.player = this._createDuder(Player, freeCells);
		this.pedro = this._createDuder(Pedro, freeCells);
		this._drawWholeMap();
	}

	_drawWholeMap() {
		let { width, height } = this.settings;

		let [cx, cy] = this.player.coords;
		// Make sure the x-axis doesn't go to the left of the left bound
		let topLeftX = Math.max(0, cx - width / 2);
		// Make sure we still have enough space to fit an entire game screen
		topLeftX = Math.min(topLeftX, this.mapWidth - width);

		// Make sure the y-axis doesn't above the top bound
		let topLeftY = Math.max(0, cy - height / 2);
		// Make sure we still have enough space to fit an entire game screen
		topLeftY = Math.min(topLeftY, this.mapHeight - height);

		for (let x = topLeftX; x < topLeftX + width; x++) {
			for (let y = topLeftY; y < topLeftY + height; y++) {
				// Fetch the glyph for the tile and render it to the screen
				// at the offset position.
				let char = this.map[x + "," + y];
				this.display.draw(x - topLeftX, y - topLeftY, char);

				let wall = this.walls[x + "," + y];
				if (wall) {
					this.display.draw(
						x - topLeftX,
						y - topLeftY,
						wall,
						this.settings.wall
					);
				}
			}
		}

		this.display.draw(cx - topLeftX, cy - topLeftY, "B", "yellow");

		let [px, py] = this.pedro.coords;
		this.display.draw(px - topLeftX, py - topLeftY, "P", "red");
	}

	_generateBoxes(freeCells) {
		for (let i = 0; i < 10; i++) {
			let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
			let key = freeCells.splice(index, 1)[0];
			this.map[key] = BOX;
			/* first box contains an ananas */
			if (i === 0) {
				this.ananas = key;
			}
		}
	}

	/** Creates a duder of the given type, in one of given places */
	_createDuder(duder, freeCells) {
		let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
		let key = freeCells.splice(index, 1)[0];
		let [x, y] = key.split(",").map(c => parseInt(c));
		return new duder(this, x, y);
	}
}

export default Game;