/**
 * Parses a .LIF 1.05 file and retursn the contents in a format that gameoflife.js can use.
 */
function lifFileParser() {

	var DEFAULT_RULE = {
		survivals: [2,3],
		births: [3]
	};

	function parseRule(line) {
		var rule = {
			survivals: [],
			births: []
		};

		var slash_reached = false;
		for (var i = 2; i < line.length; i++) {
			if (!slash_reached && line[i] === '/') {
				slash_reached = true;
			}
			else if (!isNaN(line[i])) { // "2" is a number in JS
				if (!slash_reached) {
					rule.survivals.push(parseInt(line[i]));
				} else {
					rule.births.push(parseInt(line[i]));	
				}
			}
		}
		return rule;
	}

	function parseCellBlockHeader(line) {
		var coo = line.substr(2).trim().split(' ');
		return {
			x: parseInt(coo[0]),
			y: parseInt(coo[1])
		};
	}

	function parseCellBlockContent(line) {
		var cell_indexes = [];
		for (var i = 0; i < line.length; i++) {
			if (line[i] === '*') {
				cell_indexes.push(i);
			} else if (line[i] !== '.') {
				throw "Illegal character in cell block description in line: " + line;
			}
		}
		return cell_indexes;
	}

	function getLines(content) {
		return content
			.split('\n')
			.map(function(line) { return line.trim(); })
			.filter(function(line) { return line.length !== 0; });
	}

	function parseLines(lines) {
		var rule = DEFAULT_RULE;
		var liveCells = sparse2DArray();
		var current_x = null;
		var current_y = null;

		for (var i = 1; i < lines.length; i++) { // the fist line is already handled
			var line = lines[i];

			if (line[0] === '#') {
				if (line[1] === 'P') {
					var coo = parseCellBlockHeader(line);
					current_x = coo.x;
					current_y = coo.y;
				} else if (line[1] === 'R') {
					rule = parseRule(line);
				}
			} else {
				var indexes = parseCellBlockContent(line);
				indexes.forEach(function(index) {
					liveCells.set(current_x + index, current_y, 1);
				});
				current_y++;
			}
		}

		return {
			rule: rule,
			liveCells: liveCells
		};
	}

	function parseLifContent(content) {
		var lines = getLines(content);

		if (lines.length === 0) return;

		if (lines[0] !== '#Life 1.05') {
			throw "This parser has been designed for .lif 1.05 format";
		}

		return parseLines(lines);
	}

	return {
		parseLifContent: parseLifContent
	};
}