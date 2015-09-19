/**
 * A wrapper implementing an observable pattern for a single JS object (key-value pairs)
 */
function observableObject(initialState) {

	var state = initialState || {};
	var changeHandlers = {}; // handlers by key

	function bindHandler(key, handler) {
		if (!changeHandlers[key]) {
			changeHandlers[key] = [];
		}
		changeHandlers[key].push(handler);
	}

	function unbindHandler(key, handler) {
		var index = changeHandlers[key].indexOf(handler);
		if (index > -1) {
			changeHandlers[key].splice(index, 1);
		}
	}

	return {
		set: function(key, newValue, caller) {
			var oldValue = state[key];
			state[key] = newValue;

			changeHandlers[key].forEach(function(handler) {
				handler.call(null, newValue, oldValue, caller);
			});
		},
		bind: function(key, handler) {
			if (key.constructor === Array) {
				var unbindList = [];
				key.forEach(function(item) {
					bindHandler(item, handler);
					unbindList.push(function() {
						unbindHandler(item, handler);
					});
				});
				return function() {
					unbindList.forEach(function(unbind) {
						unbind();
					});
				};
			} else {
				bindHandler(key, handler);
				
				return function() {
					unbindHandler(key, handler);
				};
			}
		},
		get: function(key) {
			return state[key];
		}
	};
}