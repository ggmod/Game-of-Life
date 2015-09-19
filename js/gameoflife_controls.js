var DEFAULT_GAME_PATTERN = 
	'#Life 1.05\n' +
	'#P -13 -3\n' +
	'.*.*\n' +
	'*\n' +
	'.*..*\n' +
	'...***\n' +
	'#P 13 2\n' +
	'**\n' +
	'*';

window.addEventListener('load', function() {

	// UI elements: 

	var canvas = document.getElementById('game-canvas');
	canvas.width = document.body.clientWidth;

	var stepForwardButton = document.getElementById('step-forward-button');
	var stepBackButton = document.getElementById('step-back-button');
	var pauseButton = document.getElementById('pause-button');
	var playButton = document.getElementById('play-button');
	var restartButton = document.getElementById('restart-button');

	var generationCounter = document.getElementById('generation-counter');
	var intervalInput = document.getElementById('interval-input');
	var processedGenerationCounter = document.getElementById('processed-generation-counter');
	
	var zoomInButton = document.getElementById('zoom-in-button');
	var zoomOutButton = document.getElementById('zoom-out-button');
	var recenterButton = document.getElementById('recenter-button');

	var loadFileContentButton = document.getElementById('load-file-content-button');
	var fileContentTextarea = document.getElementById('file-content-textarea');
	var loadLocalFileButton = document.getElementById('load-file-local-button');

	// initialize program components:

	var model = observableObject({
		generation: 0,
		processedGeneration: 0,
		running: false,
		interval: 100 // ms
	}, true);

	var fileParser = lifFileParser();
	var startPattern = fileParser.parseLifContent(DEFAULT_GAME_PATTERN).liveCells;

	var game = gameOfLife(canvas)
		.initialize(startPattern)
		.iterateCallback(function(generation, processedGeneration) {
			model.set('generation', generation, game);
			model.set('processedGeneration', processedGeneration);
		});

	var timer = createTimer()
		.callback(function() {
			game.iterate();
		})
		.model(model)
		.bindRunning('running')
		.bindInterval('interval');

	// register input event handlers:

	stepForwardButton.onclick = function() {
		game.iterate();
	};
	stepBackButton.onclick = function() {
		model.set('generation', model.get('generation') - 1);
	};
	playButton.onclick = function() {
		model.set('running', true);
	};
	pauseButton.onclick = function() {
		model.set('running', false);
	};
	restartButton.onclick = function() {
		model.set('generation', 0);
	};

	loadFileContentButton.onclick = function() {
		var pattern = fileParser.parseLifContent(fileContentTextarea.value);
		game.setRule(pattern.rule);
		game.initialize(pattern.liveCells);
	};

	loadLocalFileButton.onchange = function(event) {
		readTextFile(event, function(content) {
			var pattern = fileParser.parseLifContent(content);
			game.setRule(pattern.rule);
			game.initialize(pattern.liveCells);
		});
	};

	numberInput(generationCounter)
		.bindValue(model, 'generation')
		.draggableValue()
		.immediate()
		.min(0);

	numberInput(intervalInput)
		.bindValue(model, 'interval')
		.min(0);

	// input disable bindings:

	model.bind(['running', 'generation'], function() {
		if (model.get('running') || model.get('generation') === 0) {
			stepBackButton.classList.add('disabled');
		} else {
			stepBackButton.classList.remove('disabled');
		}
	});

	model.bind('running', function(newValue, oldValue) {
		if (newValue) {
			stepForwardButton.classList.add('disabled');
			playButton.classList.add('disabled');
			pauseButton.classList.remove('disabled');
			generationCounter.setAttribute('disabled', 'disabled');
		} else {
			stepForwardButton.classList.remove('disabled');
			playButton.classList.remove('disabled');
			pauseButton.classList.add('disabled');
			generationCounter.removeAttribute('disabled');
		}
	});

	model.set('running', false); // initialize disabled values

	// rest of UI initialization:

	model.bind('generation', function(newValue, oldValue, caller) {
		if (caller != game) {
			game.setGeneration(newValue);
		}
	});

	model.bind('processedGeneration', function(newValue) {
		processedGenerationCounter.innerHTML = newValue;
	});

	game.zoom(-0.4); // not essential

	// register game canvas event handlers:

	window.addEventListener('resize', function() {
		canvas.width = document.body.clientWidth;
		game.refresh();
	});

	registerScroll(canvas, function(dz, cursorX, cursorY) {
		game.zoom(dz, cursorX, cursorY);
	});

	registerDrag(canvas, function(dx, dy) {
		game.move(dx, dy);
	});

	registerButtonPress(zoomInButton, function() {
		game.zoom(0.035);
	});

	registerButtonPress(zoomOutButton, function() {
		game.zoom(-0.035);
	});

	recenterButton.onclick = function() {
		game.recenter();
	};

}, false);