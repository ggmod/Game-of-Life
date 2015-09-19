/**
 * Contains the program logic and rendering of a Game of Life instance, 
 * the user input handling is not included, thus it can be customized.
 */
function gameOfLife(canvas) {

	var DEFAULT_RULE = {
		survivals: [2,3],
		births: [3]
	};

	var liveCells = sparse2DArray();

	var processed_generations = 0;
	var generation = 0;
	var history = [];
	var rule = DEFAULT_RULE;

	var iterateCallback;

	function runIterateCallback() {
		if (iterateCallback) {
			iterateCallback.call(null, generation, processed_generations, liveCells);
		}
	}

	var logic = function gameOfLifeLogic() {
		
		function getLivingNeighbourCount(x, y) {
			return (liveCells.get(x-1,y-1) || 0) + (liveCells.get(x-1,y) || 0) +
				(liveCells.get(x-1,y+1) || 0)	+ (liveCells.get(x,y-1) || 0) +
				(liveCells.get(x,y+1) || 0) + (liveCells.get(x+1,y-1) || 0) +
				(liveCells.get(x+1,y) || 0) + (liveCells.get(x+1,y+1) || 0);
		}

		function isNewLiveCell(x, y) {
			var livingNeighbours = getLivingNeighbourCount(x,y);

			if (liveCells.get(x,y) === 1) {
				return rule.survivals.indexOf(livingNeighbours) !== -1;
			} else {
				return rule.births.indexOf(livingNeighbours) !== -1;
			}
		}

		function getAllPotentialLiveCells() {
			var cells = sparse2DArray();
			liveCells.forEach(function(item, x, y) {
				cells.set(x-1, y-1, true);
				cells.set(x-1, y, true);
				cells.set(x-1, y+1, true);
				cells.set(x, y-1, true);
				cells.set(x, y, true);
				cells.set(x, y+1, true);
				cells.set(x+1, y-1, true);
				cells.set(x+1, y+1, true);
				cells.set(x+1, y+1, true);
			});
			return cells;
		}

		function iterate() {
			var newLiveCells = sparse2DArray();
			
			var cells = getAllPotentialLiveCells();
			cells.forEach(function(cell, x, y) {
				if (isNewLiveCell(x, y)) {
					newLiveCells.set(x, y, 1);
				}
			});

			liveCells = newLiveCells;

			generation++;
			processed_generations = Math.max(processed_generations, generation);

			history[generation] = liveCells;
		}

		return {
			iterate: iterate
		};
	}();

	var renderer = function gameOfLifeRenderer() {

		var context = canvas.getContext('2d');
		var cell_size = 10; // px if scale is 1

		var translate_x = 0; // px at scale 1
		var translate_y = 0;
		var scale = 1;

		var max_zoom = 10;
		var min_zoom = 0.1;

		function drawBackground() {
			context.fillStyle = 'rgb(50,50,50)';
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		function drawGrid(color, stepSize) {
			context.beginPath();
			context.lineWidth = 1;
			context.strokeStyle = color;

			// Math.floor() and 0.5 are only there to make thin lines with canvas
			var x = Math.floor((translate_x % (cell_size * stepSize)) * scale) + 0.5;
			while (x <= canvas.width) {
				context.moveTo(x, 0);
				context.lineTo(x, canvas.height);
				x += stepSize * cell_size * scale;
			}
			var y = Math.floor((translate_y % (cell_size * stepSize)) * scale) + 0.5;
			while (y <= canvas.height) {
				context.moveTo(0, y);
				context.lineTo(canvas.width, y);
				y += stepSize * cell_size * scale;
			}
			context.stroke();	
			context.closePath();
		}

		function drawLiveCell(x, y) {
			x = (x*cell_size + translate_x) * scale;
			y = (y*cell_size + translate_y) * scale;
			context.fillRect(x, y, cell_size*scale, cell_size*scale);
		}

		function drawLiveCells() {
			context.fillStyle = 'white';
			liveCells.forEach(function(value, x, y) {
				drawLiveCell(x,y);
			});
		}

		function draw() {
			drawBackground();
			drawLiveCells();
			drawGrid('rgb(70,70,70)', 1);
			drawGrid('rgb(90,90,90)', 10);
		}

		return {
			draw: draw,
			move: function(offset_x, offset_y) {
				translate_x += offset_x / scale;
				translate_y += offset_y / scale;
				draw();
			},
			zoom: function(value) {
				this.zoomAround(value, canvas.width/2, canvas.height/2);
			},
			zoomAround: function(value, cursor_x, cursor_y) {
				// value is expected to be some kind of 'dz' number, like a scroll wheelDelta
				var new_scale = scale * (1.0 + value); 

				if (new_scale > min_zoom) {
					if (new_scale > max_zoom) {
						new_scale = max_zoom;
					}

					// rearranged from "cursor_x*scale + translate_x = x_in_game = cursor_x*new_scale + new_translate_x"
					translate_x -= cursor_x / scale - cursor_x / new_scale;
					translate_y -= cursor_y / scale - cursor_y / new_scale;
					
					scale = new_scale;
					draw();
				}
			},
			recenter: function() {

				var bounds = liveCells.getBounds();

				var used_width = ((bounds.max_x - bounds.min_x + 1) * cell_size);
				var used_height = ((bounds.max_y - bounds.min_y + 1) * cell_size);
				scale = Math.min(canvas.width / used_width, canvas.height / used_height);
				if (scale > max_zoom) {
					scale = max_zoom;
				} else if (scale < min_zoom) {
					scale = min_zoom;
				}
				translate_x = -bounds.min_x * cell_size;
				translate_y = -bounds.min_y * cell_size;

				this.zoom(-0.1); // zoom out by 10% to give some space to the shape
				draw();
			}
		};
	}();

	function initialize(initialLiveCells) {
		liveCells = initialLiveCells;
		generation = 0;
		processed_generations = 0;
		history = [];
		history.push(liveCells);

		renderer.recenter();
		renderer.draw();
		runIterateCallback();
		return this;
	}

	function iterate() {
		logic.iterate();
		renderer.draw();
		runIterateCallback();
	}

	function setGeneration(newGeneration) {
		if (newGeneration > processed_generations) {
			if (generation < processed_generations) {
				liveCells = history[processed_generations];
				generation = processed_generations;	
			}
			while (generation < newGeneration) {
				logic.iterate();
			}
		} else if (newGeneration >= 0) {
			liveCells = history[newGeneration];
			generation = newGeneration;
		} else {
			throw "Game generation cannot be set to a negative number";
		}

		renderer.draw();
		runIterateCallback();
	}

	return {
		iterate: iterate,
		initialize: initialize,
		iterateCallback: function(callback) {
			iterateCallback = callback;
			return this;
		},
		setRule: function(newRule) {
			rule = newRule;
			return this;
		},
		setGeneration: setGeneration,

		move: renderer.move,
		zoom: renderer.zoom,
		zoomAround: renderer.zoomAround,
		recenter: renderer.recenter,
		refresh: renderer.draw
	};
}

function sparse2DArray(initialValue) {
	
	var itemsByX = initialValue || {};

	return {
		get: function(x, y) {
			if (typeof itemsByX[x] === 'undefined') {
				return undefined;
			}
			return itemsByX[x][y];
		},
		set: function(x, y, value) {
			if (typeof itemsByX[x] === 'undefined') {
				itemsByX[x] = {};
			}
			itemsByX[x][y] = value;
		},
		forEach: function(callback) {
			for (var x in itemsByX) {
				for (var y in itemsByX[x]) {
					callback.call(null, itemsByX[x][y], parseInt(x), parseInt(y));
				}
			}
		},
		getBounds: function() {
			var bounds = {};
			for (var x in itemsByX) {
				x = parseInt(x);
				if (typeof bounds.min_x === 'undefined' || bounds.min_x > x) {
					bounds.min_x = x;
				}
				if (typeof bounds.max_x === 'undefined' || bounds.max_x < x) {
					bounds.max_x = x;
				}
				for (var y in itemsByX[x]) {
					y = parseInt(y);
					if (typeof bounds.min_y === 'undefined' || bounds.min_y > y) {
						bounds.min_y = y;
					}
					if (typeof bounds.max_y === 'undefined' || bounds.max_y < y) {
						bounds.max_y = y;
					}
				}
			}
			return bounds;
		}
	};
}