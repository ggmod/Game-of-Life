// Utility functions for basic UI features: (I didn't want to depend on any frameworks)

var IS_FIREFOX = typeof InstallTrigger !== 'undefined';

function registerDrag(element, callback) {

	var draggedFrom = null;

	function canvasMouseupHandler(event) {
		draggedFrom = null;
		document.removeEventListener('mouseup', canvasMouseupHandler);
		document.removeEventListener('mousemove', canvasMousemoveHandler);
		element.classList.remove('dragged');
	}

	function canvasMousemoveHandler(event) {
		if (IS_FIREFOX && element.tagName === 'CANVAS') { // https://bugzilla.mozilla.org/show_bug.cgi?id=732621 similar problem
			setTimeout(function() {
				if (draggedFrom) {
					callback(event.clientX - draggedFrom.x, event.clientY - draggedFrom.y);
					draggedFrom = { x: event.clientX, y: event.clientY };
				}
			}, 0);
		} else {
			callback(event.clientX - draggedFrom.x, event.clientY - draggedFrom.y);
			draggedFrom = { x: event.clientX, y: event.clientY };
		}
	}

	element.addEventListener('mousedown', function(event) {
		element.classList.add('dragged');
		draggedFrom = { x: event.clientX, y: event.clientY };
		document.addEventListener('mouseup', canvasMouseupHandler);
		document.addEventListener('mousemove', canvasMousemoveHandler);
		return false;
	}, true);
}

function registerScroll(element, callback) {
	if (IS_FIREFOX && element.tagName === 'CANVAS') {
		element.addEventListener('DOMMouseScroll', function(event) {
			setTimeout(function() { // https://bugzilla.mozilla.org/show_bug.cgi?id=732621
				callback(-0.02 * event.detail, event.layerX, event.layerY);
			}, 0);
			event.preventDefault();
		}, true);
	} else {
		element.addEventListener('mousewheel', function(event) {
			callback(0.00035 * event.wheelDelta, event.offsetX, event.offsetY);
			event.preventDefault();
		}, true);
	}
}

// continous pressing
function registerButtonPress(button, callback) {

	var timer = null;
	button.addEventListener('mousedown', function(event) {
	    timer = setInterval(function() {
			callback();
		}, 20);
	});
	button.addEventListener('mouseup', function() {
    	clearInterval(timer);
	});
	button.addEventListener('mouseleave', function() {
    	clearInterval(timer);
	});
}	


function createTimer() {
	var model = null;
	var callback = null;
	var timer_id = null;

	var intervalModelPath, runningModelPath;

	function startTimer() {
		stopTimer();
		timer_id = window.setInterval(function() {
			callback();
		}, model.get(intervalModelPath));
	}

	function stopTimer() {
		// doesn't throw an error if timer_id is null
		window.clearInterval(timer_id); 
	}

	return {
		model: function(model_) { 
			model = model_;
			return this;
		},
		callback: function(callback_) {
			callback = callback_;
			return this;
		},
		bindInterval: function(modelPath) {
			intervalModelPath = modelPath;

			model.bind(modelPath, function(newValue) {
				if (model.get(runningModelPath)) {
					startTimer();
				}
			});

			return this;
		},
		bindRunning: function(modelPath) {
			runningModelPath = modelPath;

			model.bind(modelPath, function(newValue) {
				if (newValue) {
					startTimer();
				} else {
					stopTimer();
				}
			});

			return this;
		}
	};
}


function numberInput(element) {

	var model = null;
	var modelPath = null;
	
	var min = null;
	var isImmediate = false;

	var caller_id = Math.random();

	function valid(value) {
		return min !== null ? value >= min : true;
	}

	function setModelValue(modelPath) {
		var newInputValue = parseFloat(element.value); // doesn't throw an error: returns NaN

		if (valid(newInputValue)) {
			model.set(modelPath, newInputValue, caller_id);
		}
	}

	function bindValue(model_, modelPath_) {
		model = model_;
		modelPath = modelPath_;

		element.value = model.get(modelPath);

		model.bind(modelPath, function(newValue, oldValue, caller) {
			if (caller !== caller_id) { // avoid "echoes"
				element.value = newValue;
			}
		});

		element.onchange = function() {
			setModelValue(modelPath);
		};
		element.onkeyup = function() {
			if (isImmediate) {
				setModelValue(modelPath);
			}
		};
		return this;
	}

	// drag:

	var dragScale = 1;

	function setModelValueFromDrag(dy) {
		if (dy === 0) { // to avoid flickering
			return;
		}
		var newValue = model.get(modelPath) + dragScale * dy;
		
		if (valid(newValue)) {
			model.set(modelPath, newValue);
		}
	}

	function draggableValue() {
		element.classList.add('dragnumberinput');
		element.ondragstart = function() { return false; }; // disable default drag content behaviour

		registerDrag(element, function(dx, dy) {
			setModelValueFromDrag(dy);
		});

		return this;
	}

	return {
		min: function(minValue) {
			min = minValue;
			element.setAttribute('min', minValue);
			return this;
		},
		immediate: function() {
			isImmediate = true;
			return this;
		},
		bindValue: bindValue,
		draggableValue: draggableValue
	};
}

function readTextFile(event, callback) {
	var file = event.target.files[0];
	var reader = new FileReader();
	reader.onload = function(event) {
		console.log(event.target.result);
		callback(event.target.result);
	};
	reader.readAsText(file);
}