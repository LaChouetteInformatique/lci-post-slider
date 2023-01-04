(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],2:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var postfix = _interopDefault(require('@tannin/postfix'));
var evaluate = _interopDefault(require('@tannin/evaluate'));

/**
 * Given a C expression, returns a function which can be called to evaluate its
 * result.
 *
 * @example
 *
 * ```js
 * import compile from '@tannin/compile';
 *
 * const evaluate = compile( 'n > 1' );
 *
 * evaluate( { n: 2 } );
 * // ⇒ true
 * ```
 *
 * @param {string} expression C expression.
 *
 * @return {(variables?:{[variable:string]:*})=>*} Compiled evaluator.
 */
function compile( expression ) {
	var terms = postfix( expression );

	return function( variables ) {
		return evaluate( terms, variables );
	};
}

module.exports = compile;

},{"@tannin/evaluate":3,"@tannin/postfix":5}],3:[function(require,module,exports){
'use strict';

/**
 * Operator callback functions.
 *
 * @type {Object}
 */
var OPERATORS = {
	'!': function( a ) {
		return ! a;
	},
	'*': function( a, b ) {
		return a * b;
	},
	'/': function( a, b ) {
		return a / b;
	},
	'%': function( a, b ) {
		return a % b;
	},
	'+': function( a, b ) {
		return a + b;
	},
	'-': function( a, b ) {
		return a - b;
	},
	'<': function( a, b ) {
		return a < b;
	},
	'<=': function( a, b ) {
		return a <= b;
	},
	'>': function( a, b ) {
		return a > b;
	},
	'>=': function( a, b ) {
		return a >= b;
	},
	'==': function( a, b ) {
		return a === b;
	},
	'!=': function( a, b ) {
		return a !== b;
	},
	'&&': function( a, b ) {
		return a && b;
	},
	'||': function( a, b ) {
		return a || b;
	},
	'?:': function( a, b, c ) {
		if ( a ) {
			throw b;
		}

		return c;
	},
};

/**
 * Given an array of postfix terms and operand variables, returns the result of
 * the postfix evaluation.
 *
 * @example
 *
 * ```js
 * import evaluate from '@tannin/evaluate';
 *
 * // 3 + 4 * 5 / 6 ⇒ '3 4 5 * 6 / +'
 * const terms = [ '3', '4', '5', '*', '6', '/', '+' ];
 *
 * evaluate( terms, {} );
 * // ⇒ 6.333333333333334
 * ```
 *
 * @param {string[]} postfix   Postfix terms.
 * @param {Object}   variables Operand variables.
 *
 * @return {*} Result of evaluation.
 */
function evaluate( postfix, variables ) {
	var stack = [],
		i, j, args, getOperatorResult, term, value;

	for ( i = 0; i < postfix.length; i++ ) {
		term = postfix[ i ];

		getOperatorResult = OPERATORS[ term ];
		if ( getOperatorResult ) {
			// Pop from stack by number of function arguments.
			j = getOperatorResult.length;
			args = Array( j );
			while ( j-- ) {
				args[ j ] = stack.pop();
			}

			try {
				value = getOperatorResult.apply( null, args );
			} catch ( earlyReturn ) {
				return earlyReturn;
			}
		} else if ( variables.hasOwnProperty( term ) ) {
			value = variables[ term ];
		} else {
			value = +term;
		}

		stack.push( value );
	}

	return stack[ 0 ];
}

module.exports = evaluate;

},{}],4:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var compile = _interopDefault(require('@tannin/compile'));

/**
 * Given a C expression, returns a function which, when called with a value,
 * evaluates the result with the value assumed to be the "n" variable of the
 * expression. The result will be coerced to its numeric equivalent.
 *
 * @param {string} expression C expression.
 *
 * @return {Function} Evaluator function.
 */
function pluralForms( expression ) {
	var evaluate = compile( expression );

	return function( n ) {
		return +evaluate( { n: n } );
	};
}

module.exports = pluralForms;

},{"@tannin/compile":2}],5:[function(require,module,exports){
'use strict';

var PRECEDENCE, OPENERS, TERMINATORS, PATTERN;

/**
 * Operator precedence mapping.
 *
 * @type {Object}
 */
PRECEDENCE = {
	'(': 9,
	'!': 8,
	'*': 7,
	'/': 7,
	'%': 7,
	'+': 6,
	'-': 6,
	'<': 5,
	'<=': 5,
	'>': 5,
	'>=': 5,
	'==': 4,
	'!=': 4,
	'&&': 3,
	'||': 2,
	'?': 1,
	'?:': 1,
};

/**
 * Characters which signal pair opening, to be terminated by terminators.
 *
 * @type {string[]}
 */
OPENERS = [ '(', '?' ];

/**
 * Characters which signal pair termination, the value an array with the
 * opener as its first member. The second member is an optional operator
 * replacement to push to the stack.
 *
 * @type {string[]}
 */
TERMINATORS = {
	')': [ '(' ],
	':': [ '?', '?:' ],
};

/**
 * Pattern matching operators and openers.
 *
 * @type {RegExp}
 */
PATTERN = /<=|>=|==|!=|&&|\|\||\?:|\(|!|\*|\/|%|\+|-|<|>|\?|\)|:/;

/**
 * Given a C expression, returns the equivalent postfix (Reverse Polish)
 * notation terms as an array.
 *
 * If a postfix string is desired, simply `.join( ' ' )` the result.
 *
 * @example
 *
 * ```js
 * import postfix from '@tannin/postfix';
 *
 * postfix( 'n > 1' );
 * // ⇒ [ 'n', '1', '>' ]
 * ```
 *
 * @param {string} expression C expression.
 *
 * @return {string[]} Postfix terms.
 */
function postfix( expression ) {
	var terms = [],
		stack = [],
		match, operator, term, element;

	while ( ( match = expression.match( PATTERN ) ) ) {
		operator = match[ 0 ];

		// Term is the string preceding the operator match. It may contain
		// whitespace, and may be empty (if operator is at beginning).
		term = expression.substr( 0, match.index ).trim();
		if ( term ) {
			terms.push( term );
		}

		while ( ( element = stack.pop() ) ) {
			if ( TERMINATORS[ operator ] ) {
				if ( TERMINATORS[ operator ][ 0 ] === element ) {
					// Substitution works here under assumption that because
					// the assigned operator will no longer be a terminator, it
					// will be pushed to the stack during the condition below.
					operator = TERMINATORS[ operator ][ 1 ] || operator;
					break;
				}
			} else if ( OPENERS.indexOf( element ) >= 0 || PRECEDENCE[ element ] < PRECEDENCE[ operator ] ) {
				// Push to stack if either an opener or when pop reveals an
				// element of lower precedence.
				stack.push( element );
				break;
			}

			// For each popped from stack, push to terms.
			terms.push( element );
		}

		if ( ! TERMINATORS[ operator ] ) {
			stack.push( operator );
		}

		// Slice matched fragment from expression to continue match.
		expression = expression.substr( match.index + operator.length );
	}

	// Push remainder of operand, if exists, to terms.
	expression = expression.trim();
	if ( expression ) {
		terms.push( expression );
	}

	// Pop remaining items from stack into terms.
	return terms.concat( stack.reverse() );
}

module.exports = postfix;

},{}],6:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validateNamespace = _interopRequireDefault(require("./validateNamespace.js"));

var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));

/**
 * Internal dependencies
 */

/**
 * @callback AddHook
 *
 * Adds the hook to the appropriate hooks container.
 *
 * @param {string}               hookName      Name of hook to add
 * @param {string}               namespace     The unique namespace identifying the callback in the form `vendor/plugin/function`.
 * @param {import('.').Callback} callback      Function to call when the hook is run
 * @param {number}               [priority=10] Priority of this hook
 */

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {AddHook} Function that adds a new hook.
 */
function createAddHook(hooks, storeKey) {
  return function addHook(hookName, namespace, callback) {
    let priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;
    const hooksStore = hooks[storeKey];

    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }

    if (!(0, _validateNamespace.default)(namespace)) {
      return;
    }

    if ('function' !== typeof callback) {
      // eslint-disable-next-line no-console
      console.error('The hook callback must be a function.');
      return;
    } // Validate numeric priority


    if ('number' !== typeof priority) {
      // eslint-disable-next-line no-console
      console.error('If specified, the hook priority must be a number.');
      return;
    }

    const handler = {
      callback,
      priority,
      namespace
    };

    if (hooksStore[hookName]) {
      // Find the correct insert index of the new hook.
      const handlers = hooksStore[hookName].handlers;
      /** @type {number} */

      let i;

      for (i = handlers.length; i > 0; i--) {
        if (priority >= handlers[i - 1].priority) {
          break;
        }
      }

      if (i === handlers.length) {
        // If append, operate via direct assignment.
        handlers[i] = handler;
      } else {
        // Otherwise, insert before index via splice.
        handlers.splice(i, 0, handler);
      } // We may also be currently executing this hook.  If the callback
      // we're adding would come after the current callback, there's no
      // problem; otherwise we need to increase the execution index of
      // any other runs by 1 to account for the added element.


      hooksStore.__current.forEach(hookInfo => {
        if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
          hookInfo.currentIndex++;
        }
      });
    } else {
      // This is the first hook of its type.
      hooksStore[hookName] = {
        handlers: [handler],
        runs: 0
      };
    }

    if (hookName !== 'hookAdded') {
      hooks.doAction('hookAdded', hookName, namespace, callback, priority);
    }
  };
}

var _default = createAddHook;
exports.default = _default;

},{"./validateHookName.js":15,"./validateNamespace.js":16,"@babel/runtime/helpers/interopRequireDefault":1}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {() => string | null} Function that returns the current hook name or null.
 */
function createCurrentHook(hooks, storeKey) {
  return function currentHook() {
    var _hooksStore$__current, _hooksStore$__current2;

    const hooksStore = hooks[storeKey];
    return (_hooksStore$__current = (_hooksStore$__current2 = hooksStore.__current[hooksStore.__current.length - 1]) === null || _hooksStore$__current2 === void 0 ? void 0 : _hooksStore$__current2.name) !== null && _hooksStore$__current !== void 0 ? _hooksStore$__current : null;
  };
}

var _default = createCurrentHook;
exports.default = _default;

},{}],8:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));

/**
 * Internal dependencies
 */

/**
 * @callback DidHook
 *
 * Returns the number of times an action has been fired.
 *
 * @param {string} hookName The hook name to check.
 *
 * @return {number | undefined} The number of times the hook has run.
 */

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DidHook} Function that returns a hook's call count.
 */
function createDidHook(hooks, storeKey) {
  return function didHook(hookName) {
    const hooksStore = hooks[storeKey];

    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }

    return hooksStore[hookName] && hooksStore[hookName].runs ? hooksStore[hookName].runs : 0;
  };
}

var _default = createDidHook;
exports.default = _default;

},{"./validateHookName.js":15,"@babel/runtime/helpers/interopRequireDefault":1}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * @callback DoingHook
 * Returns whether a hook is currently being executed.
 *
 * @param {string} [hookName] The name of the hook to check for.  If
 *                            omitted, will check for any hook being executed.
 *
 * @return {boolean} Whether the hook is being executed.
 */

/**
 * Returns a function which, when invoked, will return whether a hook is
 * currently being executed.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DoingHook} Function that returns whether a hook is currently
 *                     being executed.
 */
function createDoingHook(hooks, storeKey) {
  return function doingHook(hookName) {
    const hooksStore = hooks[storeKey]; // If the hookName was not passed, check for any current hook.

    if ('undefined' === typeof hookName) {
      return 'undefined' !== typeof hooksStore.__current[0];
    } // Return the __current hook.


    return hooksStore.__current[0] ? hookName === hooksStore.__current[0].name : false;
  };
}

var _default = createDoingHook;
exports.default = _default;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * @callback HasHook
 *
 * Returns whether any handlers are attached for the given hookName and optional namespace.
 *
 * @param {string} hookName    The name of the hook to check for.
 * @param {string} [namespace] Optional. The unique namespace identifying the callback
 *                             in the form `vendor/plugin/function`.
 *
 * @return {boolean} Whether there are handlers that are attached to the given hook.
 */

/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {HasHook} Function that returns whether any handlers are
 *                   attached to a particular hook and optional namespace.
 */
function createHasHook(hooks, storeKey) {
  return function hasHook(hookName, namespace) {
    const hooksStore = hooks[storeKey]; // Use the namespace if provided.

    if ('undefined' !== typeof namespace) {
      return hookName in hooksStore && hooksStore[hookName].handlers.some(hook => hook.namespace === namespace);
    }

    return hookName in hooksStore;
  };
}

var _default = createHasHook;
exports.default = _default;

},{}],11:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports._Hooks = void 0;

var _createAddHook = _interopRequireDefault(require("./createAddHook"));

var _createRemoveHook = _interopRequireDefault(require("./createRemoveHook"));

var _createHasHook = _interopRequireDefault(require("./createHasHook"));

var _createRunHook = _interopRequireDefault(require("./createRunHook"));

var _createCurrentHook = _interopRequireDefault(require("./createCurrentHook"));

var _createDoingHook = _interopRequireDefault(require("./createDoingHook"));

var _createDidHook = _interopRequireDefault(require("./createDidHook"));

/**
 * Internal dependencies
 */

/**
 * Internal class for constructing hooks. Use `createHooks()` function
 *
 * Note, it is necessary to expose this class to make its type public.
 *
 * @private
 */
class _Hooks {
  constructor() {
    /** @type {import('.').Store} actions */
    this.actions = Object.create(null);
    this.actions.__current = [];
    /** @type {import('.').Store} filters */

    this.filters = Object.create(null);
    this.filters.__current = [];
    this.addAction = (0, _createAddHook.default)(this, 'actions');
    this.addFilter = (0, _createAddHook.default)(this, 'filters');
    this.removeAction = (0, _createRemoveHook.default)(this, 'actions');
    this.removeFilter = (0, _createRemoveHook.default)(this, 'filters');
    this.hasAction = (0, _createHasHook.default)(this, 'actions');
    this.hasFilter = (0, _createHasHook.default)(this, 'filters');
    this.removeAllActions = (0, _createRemoveHook.default)(this, 'actions', true);
    this.removeAllFilters = (0, _createRemoveHook.default)(this, 'filters', true);
    this.doAction = (0, _createRunHook.default)(this, 'actions');
    this.applyFilters = (0, _createRunHook.default)(this, 'filters', true);
    this.currentAction = (0, _createCurrentHook.default)(this, 'actions');
    this.currentFilter = (0, _createCurrentHook.default)(this, 'filters');
    this.doingAction = (0, _createDoingHook.default)(this, 'actions');
    this.doingFilter = (0, _createDoingHook.default)(this, 'filters');
    this.didAction = (0, _createDidHook.default)(this, 'actions');
    this.didFilter = (0, _createDidHook.default)(this, 'filters');
  }

}
/** @typedef {_Hooks} Hooks */

/**
 * Returns an instance of the hooks object.
 *
 * @return {Hooks} A Hooks instance.
 */


exports._Hooks = _Hooks;

function createHooks() {
  return new _Hooks();
}

var _default = createHooks;
exports.default = _default;

},{"./createAddHook":6,"./createCurrentHook":7,"./createDidHook":8,"./createDoingHook":9,"./createHasHook":10,"./createRemoveHook":12,"./createRunHook":13,"@babel/runtime/helpers/interopRequireDefault":1}],12:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validateNamespace = _interopRequireDefault(require("./validateNamespace.js"));

var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));

/**
 * Internal dependencies
 */

/**
 * @callback RemoveHook
 * Removes the specified callback (or all callbacks) from the hook with a given hookName
 * and namespace.
 *
 * @param {string} hookName  The name of the hook to modify.
 * @param {string} namespace The unique namespace identifying the callback in the
 *                           form `vendor/plugin/function`.
 *
 * @return {number | undefined} The number of callbacks removed.
 */

/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param {import('.').Hooks}    hooks             Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [removeAll=false] Whether to remove all callbacks for a hookName,
 *                                                 without regard to namespace. Used to create
 *                                                 `removeAll*` functions.
 *
 * @return {RemoveHook} Function that removes hooks.
 */
function createRemoveHook(hooks, storeKey) {
  let removeAll = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return function removeHook(hookName, namespace) {
    const hooksStore = hooks[storeKey];

    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }

    if (!removeAll && !(0, _validateNamespace.default)(namespace)) {
      return;
    } // Bail if no hooks exist by this name.


    if (!hooksStore[hookName]) {
      return 0;
    }

    let handlersRemoved = 0;

    if (removeAll) {
      handlersRemoved = hooksStore[hookName].handlers.length;
      hooksStore[hookName] = {
        runs: hooksStore[hookName].runs,
        handlers: []
      };
    } else {
      // Try to find the specified callback to remove.
      const handlers = hooksStore[hookName].handlers;

      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i].namespace === namespace) {
          handlers.splice(i, 1);
          handlersRemoved++; // This callback may also be part of a hook that is
          // currently executing.  If the callback we're removing
          // comes after the current callback, there's no problem;
          // otherwise we need to decrease the execution index of any
          // other runs by 1 to account for the removed element.

          hooksStore.__current.forEach(hookInfo => {
            if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
              hookInfo.currentIndex--;
            }
          });
        }
      }
    }

    if (hookName !== 'hookRemoved') {
      hooks.doAction('hookRemoved', hookName, namespace);
    }

    return handlersRemoved;
  };
}

var _default = createRemoveHook;
exports.default = _default;

},{"./validateHookName.js":15,"./validateNamespace.js":16,"@babel/runtime/helpers/interopRequireDefault":1}],13:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param {import('.').Hooks}    hooks                  Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [returnFirstArg=false] Whether each hook callback is expected to
 *                                                      return its first argument.
 *
 * @return {(hookName:string, ...args: unknown[]) => unknown} Function that runs hook callbacks.
 */
function createRunHook(hooks, storeKey) {
  let returnFirstArg = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return function runHooks(hookName) {
    const hooksStore = hooks[storeKey];

    if (!hooksStore[hookName]) {
      hooksStore[hookName] = {
        handlers: [],
        runs: 0
      };
    }

    hooksStore[hookName].runs++;
    const handlers = hooksStore[hookName].handlers; // The following code is stripped from production builds.

    if ('production' !== process.env.NODE_ENV) {
      // Handle any 'all' hooks registered.
      if ('hookAdded' !== hookName && hooksStore.all) {
        handlers.push(...hooksStore.all.handlers);
      }
    }

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (!handlers || !handlers.length) {
      return returnFirstArg ? args[0] : undefined;
    }

    const hookInfo = {
      name: hookName,
      currentIndex: 0
    };

    hooksStore.__current.push(hookInfo);

    while (hookInfo.currentIndex < handlers.length) {
      const handler = handlers[hookInfo.currentIndex];
      const result = handler.callback.apply(null, args);

      if (returnFirstArg) {
        args[0] = result;
      }

      hookInfo.currentIndex++;
    }

    hooksStore.__current.pop();

    if (returnFirstArg) {
      return args[0];
    }
  };
}

var _default = createRunHook;
exports.default = _default;

}).call(this)}).call(this,require('_process'))

},{"_process":22}],14:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyFilters = exports.addFilter = exports.addAction = exports.actions = void 0;
Object.defineProperty(exports, "createHooks", {
  enumerable: true,
  get: function () {
    return _createHooks.default;
  }
});
exports.removeFilter = exports.removeAllFilters = exports.removeAllActions = exports.removeAction = exports.hasFilter = exports.hasAction = exports.filters = exports.doingFilter = exports.doingAction = exports.doAction = exports.didFilter = exports.didAction = exports.defaultHooks = exports.currentFilter = exports.currentAction = void 0;

var _createHooks = _interopRequireDefault(require("./createHooks"));

/**
 * Internal dependencies
 */

/** @typedef {(...args: any[])=>any} Callback */

/**
 * @typedef Handler
 * @property {Callback} callback  The callback
 * @property {string}   namespace The namespace
 * @property {number}   priority  The namespace
 */

/**
 * @typedef Hook
 * @property {Handler[]} handlers Array of handlers
 * @property {number}    runs     Run counter
 */

/**
 * @typedef Current
 * @property {string} name         Hook name
 * @property {number} currentIndex The index
 */

/**
 * @typedef {Record<string, Hook> & {__current: Current[]}} Store
 */

/**
 * @typedef {'actions' | 'filters'} StoreKey
 */

/**
 * @typedef {import('./createHooks').Hooks} Hooks
 */
const defaultHooks = (0, _createHooks.default)();
exports.defaultHooks = defaultHooks;
const {
  addAction,
  addFilter,
  removeAction,
  removeFilter,
  hasAction,
  hasFilter,
  removeAllActions,
  removeAllFilters,
  doAction,
  applyFilters,
  currentAction,
  currentFilter,
  doingAction,
  doingFilter,
  didAction,
  didFilter,
  actions,
  filters
} = defaultHooks;
exports.filters = filters;
exports.actions = actions;
exports.didFilter = didFilter;
exports.didAction = didAction;
exports.doingFilter = doingFilter;
exports.doingAction = doingAction;
exports.currentFilter = currentFilter;
exports.currentAction = currentAction;
exports.applyFilters = applyFilters;
exports.doAction = doAction;
exports.removeAllFilters = removeAllFilters;
exports.removeAllActions = removeAllActions;
exports.hasFilter = hasFilter;
exports.hasAction = hasAction;
exports.removeFilter = removeFilter;
exports.removeAction = removeAction;
exports.addFilter = addFilter;
exports.addAction = addAction;

},{"./createHooks":11,"@babel/runtime/helpers/interopRequireDefault":1}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Validate a hookName string.
 *
 * @param {string} hookName The hook name to validate. Should be a non empty string containing
 *                          only numbers, letters, dashes, periods and underscores. Also,
 *                          the hook name cannot begin with `__`.
 *
 * @return {boolean} Whether the hook name is valid.
 */
function validateHookName(hookName) {
  if ('string' !== typeof hookName || '' === hookName) {
    // eslint-disable-next-line no-console
    console.error('The hook name must be a non-empty string.');
    return false;
  }

  if (/^__/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name cannot begin with `__`.');
    return false;
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name can only contain numbers, letters, dashes, periods and underscores.');
    return false;
  }

  return true;
}

var _default = validateHookName;
exports.default = _default;

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Validate a namespace string.
 *
 * @param {string} namespace The namespace to validate - should take the form
 *                           `vendor/plugin/function`.
 *
 * @return {boolean} Whether the namespace is valid.
 */
function validateNamespace(namespace) {
  if ('string' !== typeof namespace || '' === namespace) {
    // eslint-disable-next-line no-console
    console.error('The namespace must be a non-empty string.');
    return false;
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_.\-\/]*$/.test(namespace)) {
    // eslint-disable-next-line no-console
    console.error('The namespace can only contain numbers, letters, dashes, periods, underscores and slashes.');
    return false;
  }

  return true;
}

var _default = validateNamespace;
exports.default = _default;

},{}],17:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createI18n = void 0;

var _tannin = _interopRequireDefault(require("tannin"));

/**
 * External dependencies
 */

/**
 * @typedef {Record<string,any>} LocaleData
 */

/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 *
 * @type {LocaleData}
 */
const DEFAULT_LOCALE_DATA = {
  '': {
    /** @param {number} n */
    plural_forms(n) {
      return n === 1 ? 0 : 1;
    }

  }
};
/*
 * Regular expression that matches i18n hooks like `i18n.gettext`, `i18n.ngettext`,
 * `i18n.gettext_domain` or `i18n.ngettext_with_context` or `i18n.has_translation`.
 */

const I18N_HOOK_REGEXP = /^i18n\.(n?gettext|has_translation)(_|$)/;
/**
 * @typedef {(domain?: string) => LocaleData} GetLocaleData
 *
 * Returns locale data by domain in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} SetLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will overwrite the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} AddLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will also merge the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} ResetLocaleData
 *
 * Resets all current Tannin instance locale data and sets the specified
 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/** @typedef {() => void} SubscribeCallback */

/** @typedef {() => void} UnsubscribeCallback */

/**
 * @typedef {(callback: SubscribeCallback) => UnsubscribeCallback} Subscribe
 *
 * Subscribes to changes of locale data
 */

/**
 * @typedef {(domain?: string) => string} GetFilterDomain
 * Retrieve the domain to use when calling domain-specific filters.
 */

/**
 * @typedef {(text: string, domain?: string) => string} __
 *
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 */

/**
 * @typedef {(text: string, context: string, domain?: string) => string} _x
 *
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 */

/**
 * @typedef {(single: string, plural: string, number: number, domain?: string) => string} _n
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 */

/**
 * @typedef {(single: string, plural: string, number: number, context: string, domain?: string) => string} _nx
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 */

/**
 * @typedef {() => boolean} IsRtl
 *
 * Check if current locale is RTL.
 *
 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
 */

/**
 * @typedef {(single: string, context?: string, domain?: string) => boolean} HasTranslation
 *
 * Check if there is a translation for a given string in singular form.
 */

/** @typedef {import('@wordpress/hooks').Hooks} Hooks */

/**
 * An i18n instance
 *
 * @typedef I18n
 * @property {GetLocaleData}   getLocaleData   Returns locale data by domain in a Jed-formatted JSON object shape.
 * @property {SetLocaleData}   setLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will overwrite the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {AddLocaleData}   addLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will also merge the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {ResetLocaleData} resetLocaleData Resets all current Tannin instance locale data and sets the specified
 *                                             locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 * @property {Subscribe}       subscribe       Subscribes to changes of Tannin locale data.
 * @property {__}              __              Retrieve the translation of text.
 * @property {_x}              _x              Retrieve translated string with gettext context.
 * @property {_n}              _n              Translates and retrieves the singular or plural form based on the supplied
 *                                             number.
 * @property {_nx}             _nx             Translates and retrieves the singular or plural form based on the supplied
 *                                             number, with gettext context.
 * @property {IsRtl}           isRTL           Check if current locale is RTL.
 * @property {HasTranslation}  hasTranslation  Check if there is a translation for a given string.
 */

/**
 * Create an i18n instance
 *
 * @param {LocaleData} [initialData]   Locale data configuration.
 * @param {string}     [initialDomain] Domain for which configuration applies.
 * @param {Hooks}      [hooks]         Hooks implementation.
 *
 * @return {I18n} I18n instance.
 */

const createI18n = (initialData, initialDomain, hooks) => {
  /**
   * The underlying instance of Tannin to which exported functions interface.
   *
   * @type {Tannin}
   */
  const tannin = new _tannin.default({});
  const listeners = new Set();

  const notifyListeners = () => {
    listeners.forEach(listener => listener());
  };
  /**
   * Subscribe to changes of locale data.
   *
   * @param {SubscribeCallback} callback Subscription callback.
   * @return {UnsubscribeCallback} Unsubscribe callback.
   */


  const subscribe = callback => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };
  /** @type {GetLocaleData} */


  const getLocaleData = function () {
    let domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    return tannin.data[domain];
  };
  /**
   * @param {LocaleData} [data]
   * @param {string}     [domain]
   */


  const doSetLocaleData = function (data) {
    var _tannin$data$domain;

    let domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';
    tannin.data[domain] = { ...tannin.data[domain],
      ...data
    }; // Populate default domain configuration (supported locale date which omits
    // a plural forms expression).

    tannin.data[domain][''] = { ...DEFAULT_LOCALE_DATA[''],
      ...((_tannin$data$domain = tannin.data[domain]) === null || _tannin$data$domain === void 0 ? void 0 : _tannin$data$domain[''])
    }; // Clean up cached plural forms functions cache as it might be updated.

    delete tannin.pluralForms[domain];
  };
  /** @type {SetLocaleData} */


  const setLocaleData = (data, domain) => {
    doSetLocaleData(data, domain);
    notifyListeners();
  };
  /** @type {AddLocaleData} */


  const addLocaleData = function (data) {
    var _tannin$data$domain2;

    let domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';
    tannin.data[domain] = { ...tannin.data[domain],
      ...data,
      // Populate default domain configuration (supported locale date which omits
      // a plural forms expression).
      '': { ...DEFAULT_LOCALE_DATA[''],
        ...((_tannin$data$domain2 = tannin.data[domain]) === null || _tannin$data$domain2 === void 0 ? void 0 : _tannin$data$domain2['']),
        ...(data === null || data === void 0 ? void 0 : data[''])
      }
    }; // Clean up cached plural forms functions cache as it might be updated.

    delete tannin.pluralForms[domain];
    notifyListeners();
  };
  /** @type {ResetLocaleData} */


  const resetLocaleData = (data, domain) => {
    // Reset all current Tannin locale data.
    tannin.data = {}; // Reset cached plural forms functions cache.

    tannin.pluralForms = {};
    setLocaleData(data, domain);
  };
  /**
   * Wrapper for Tannin's `dcnpgettext`. Populates default locale data if not
   * otherwise previously assigned.
   *
   * @param {string|undefined} domain   Domain to retrieve the translated text.
   * @param {string|undefined} context  Context information for the translators.
   * @param {string}           single   Text to translate if non-plural. Used as
   *                                    fallback return value on a caught error.
   * @param {string}           [plural] The text to be used if the number is
   *                                    plural.
   * @param {number}           [number] The number to compare against to use
   *                                    either the singular or plural form.
   *
   * @return {string} The translated string.
   */


  const dcnpgettext = function () {
    let domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    let context = arguments.length > 1 ? arguments[1] : undefined;
    let single = arguments.length > 2 ? arguments[2] : undefined;
    let plural = arguments.length > 3 ? arguments[3] : undefined;
    let number = arguments.length > 4 ? arguments[4] : undefined;

    if (!tannin.data[domain]) {
      // Use `doSetLocaleData` to set silently, without notifying listeners.
      doSetLocaleData(undefined, domain);
    }

    return tannin.dcnpgettext(domain, context, single, plural, number);
  };
  /** @type {GetFilterDomain} */


  const getFilterDomain = function () {
    let domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    return domain;
  };
  /** @type {__} */


  const __ = (text, domain) => {
    let translation = dcnpgettext(domain, undefined, text);

    if (!hooks) {
      return translation;
    }
    /**
     * Filters text with its translation.
     *
     * @param {string} translation Translated text.
     * @param {string} text        Text to translate.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */


    translation =
    /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.gettext', translation, text, domain);
    return (
      /** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.gettext_' + getFilterDomain(domain), translation, text, domain)
    );
  };
  /** @type {_x} */


  const _x = (text, context, domain) => {
    let translation = dcnpgettext(domain, context, text);

    if (!hooks) {
      return translation;
    }
    /**
     * Filters text with its translation based on context information.
     *
     * @param {string} translation Translated text.
     * @param {string} text        Text to translate.
     * @param {string} context     Context information for the translators.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */


    translation =
    /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.gettext_with_context', translation, text, context, domain);
    return (
      /** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.gettext_with_context_' + getFilterDomain(domain), translation, text, context, domain)
    );
  };
  /** @type {_n} */


  const _n = (single, plural, number, domain) => {
    let translation = dcnpgettext(domain, undefined, single, plural, number);

    if (!hooks) {
      return translation;
    }
    /**
     * Filters the singular or plural form of a string.
     *
     * @param {string} translation Translated text.
     * @param {string} single      The text to be used if the number is singular.
     * @param {string} plural      The text to be used if the number is plural.
     * @param {string} number      The number to compare against to use either the singular or plural form.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */


    translation =
    /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.ngettext', translation, single, plural, number, domain);
    return (
      /** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.ngettext_' + getFilterDomain(domain), translation, single, plural, number, domain)
    );
  };
  /** @type {_nx} */


  const _nx = (single, plural, number, context, domain) => {
    let translation = dcnpgettext(domain, context, single, plural, number);

    if (!hooks) {
      return translation;
    }
    /**
     * Filters the singular or plural form of a string with gettext context.
     *
     * @param {string} translation Translated text.
     * @param {string} single      The text to be used if the number is singular.
     * @param {string} plural      The text to be used if the number is plural.
     * @param {string} number      The number to compare against to use either the singular or plural form.
     * @param {string} context     Context information for the translators.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */


    translation =
    /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.ngettext_with_context', translation, single, plural, number, context, domain);
    return (
      /** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.ngettext_with_context_' + getFilterDomain(domain), translation, single, plural, number, context, domain)
    );
  };
  /** @type {IsRtl} */


  const isRTL = () => {
    return 'rtl' === _x('ltr', 'text direction');
  };
  /** @type {HasTranslation} */


  const hasTranslation = (single, context, domain) => {
    var _tannin$data, _tannin$data2;

    const key = context ? context + '\u0004' + single : single;
    let result = !!((_tannin$data = tannin.data) !== null && _tannin$data !== void 0 && (_tannin$data2 = _tannin$data[domain !== null && domain !== void 0 ? domain : 'default']) !== null && _tannin$data2 !== void 0 && _tannin$data2[key]);

    if (hooks) {
      /**
       * Filters the presence of a translation in the locale data.
       *
       * @param {boolean} hasTranslation Whether the translation is present or not..
       * @param {string}  single         The singular form of the translated text (used as key in locale data)
       * @param {string}  context        Context information for the translators.
       * @param {string}  domain         Text domain. Unique identifier for retrieving translated strings.
       */
      result =
      /** @type { boolean } */

      /** @type {*} */
      hooks.applyFilters('i18n.has_translation', result, single, context, domain);
      result =
      /** @type { boolean } */

      /** @type {*} */
      hooks.applyFilters('i18n.has_translation_' + getFilterDomain(domain), result, single, context, domain);
    }

    return result;
  };

  if (initialData) {
    setLocaleData(initialData, initialDomain);
  }

  if (hooks) {
    /**
     * @param {string} hookName
     */
    const onHookAddedOrRemoved = hookName => {
      if (I18N_HOOK_REGEXP.test(hookName)) {
        notifyListeners();
      }
    };

    hooks.addAction('hookAdded', 'core/i18n', onHookAddedOrRemoved);
    hooks.addAction('hookRemoved', 'core/i18n', onHookAddedOrRemoved);
  }

  return {
    getLocaleData,
    setLocaleData,
    addLocaleData,
    resetLocaleData,
    subscribe,
    __,
    _x,
    _n,
    _nx,
    isRTL,
    hasTranslation
  };
};

exports.createI18n = createI18n;

},{"@babel/runtime/helpers/interopRequireDefault":1,"tannin":24}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribe = exports.setLocaleData = exports.resetLocaleData = exports.isRTL = exports.hasTranslation = exports.getLocaleData = exports.default = exports._x = exports._nx = exports._n = exports.__ = void 0;

var _createI18n = require("./create-i18n");

var _hooks = require("@wordpress/hooks");

/**
 * Internal dependencies
 */

/**
 * WordPress dependencies
 */
const i18n = (0, _createI18n.createI18n)(undefined, undefined, _hooks.defaultHooks);
/**
 * Default, singleton instance of `I18n`.
 */

var _default = i18n;
/*
 * Comments in this file are duplicated from ./i18n due to
 * https://github.com/WordPress/gutenberg/pull/20318#issuecomment-590837722
 */

/**
 * @typedef {import('./create-i18n').LocaleData} LocaleData
 * @typedef {import('./create-i18n').SubscribeCallback} SubscribeCallback
 * @typedef {import('./create-i18n').UnsubscribeCallback} UnsubscribeCallback
 */

/**
 * Returns locale data by domain in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {string} [domain] Domain for which to get the data.
 * @return {LocaleData} Locale data.
 */

exports.default = _default;
const getLocaleData = i18n.getLocaleData.bind(i18n);
/**
 * Merges locale data into the Tannin instance by domain. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {LocaleData} [data]   Locale data configuration.
 * @param {string}     [domain] Domain for which configuration applies.
 */

exports.getLocaleData = getLocaleData;
const setLocaleData = i18n.setLocaleData.bind(i18n);
/**
 * Resets all current Tannin instance locale data and sets the specified
 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {LocaleData} [data]   Locale data configuration.
 * @param {string}     [domain] Domain for which configuration applies.
 */

exports.setLocaleData = setLocaleData;
const resetLocaleData = i18n.resetLocaleData.bind(i18n);
/**
 * Subscribes to changes of locale data
 *
 * @param {SubscribeCallback} callback Subscription callback
 * @return {UnsubscribeCallback} Unsubscribe callback
 */

exports.resetLocaleData = resetLocaleData;
const subscribe = i18n.subscribe.bind(i18n);
/**
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 *
 * @param {string} text     Text to translate.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} Translated text.
 */

exports.subscribe = subscribe;

const __ = i18n.__.bind(i18n);
/**
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 *
 * @param {string} text     Text to translate.
 * @param {string} context  Context information for the translators.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} Translated context string without pipe.
 */


exports.__ = __;

const _x = i18n._x.bind(i18n);
/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 *
 * @param {string} single   The text to be used if the number is singular.
 * @param {string} plural   The text to be used if the number is plural.
 * @param {number} number   The number to compare against to use either the
 *                          singular or plural form.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */


exports._x = _x;

const _n = i18n._n.bind(i18n);
/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 *
 * @param {string} single   The text to be used if the number is singular.
 * @param {string} plural   The text to be used if the number is plural.
 * @param {number} number   The number to compare against to use either the
 *                          singular or plural form.
 * @param {string} context  Context information for the translators.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */


exports._n = _n;

const _nx = i18n._nx.bind(i18n);
/**
 * Check if current locale is RTL.
 *
 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
 *
 * @return {boolean} Whether locale is RTL.
 */


exports._nx = _nx;
const isRTL = i18n.isRTL.bind(i18n);
/**
 * Check if there is a translation for a given string (in singular form).
 *
 * @param {string} single    Singular form of the string to look up.
 * @param {string} [context] Context information for the translators.
 * @param {string} [domain]  Domain to retrieve the translated text.
 * @return {boolean} Whether the translation exists or not.
 */

exports.isRTL = isRTL;
const hasTranslation = i18n.hasTranslation.bind(i18n);
exports.hasTranslation = hasTranslation;

},{"./create-i18n":17,"@wordpress/hooks":14}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  sprintf: true,
  defaultI18n: true,
  setLocaleData: true,
  resetLocaleData: true,
  getLocaleData: true,
  subscribe: true,
  __: true,
  _x: true,
  _n: true,
  _nx: true,
  isRTL: true,
  hasTranslation: true
};
Object.defineProperty(exports, "__", {
  enumerable: true,
  get: function () {
    return _defaultI18n.__;
  }
});
Object.defineProperty(exports, "_n", {
  enumerable: true,
  get: function () {
    return _defaultI18n._n;
  }
});
Object.defineProperty(exports, "_nx", {
  enumerable: true,
  get: function () {
    return _defaultI18n._nx;
  }
});
Object.defineProperty(exports, "_x", {
  enumerable: true,
  get: function () {
    return _defaultI18n._x;
  }
});
Object.defineProperty(exports, "defaultI18n", {
  enumerable: true,
  get: function () {
    return _defaultI18n.default;
  }
});
Object.defineProperty(exports, "getLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.getLocaleData;
  }
});
Object.defineProperty(exports, "hasTranslation", {
  enumerable: true,
  get: function () {
    return _defaultI18n.hasTranslation;
  }
});
Object.defineProperty(exports, "isRTL", {
  enumerable: true,
  get: function () {
    return _defaultI18n.isRTL;
  }
});
Object.defineProperty(exports, "resetLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.resetLocaleData;
  }
});
Object.defineProperty(exports, "setLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.setLocaleData;
  }
});
Object.defineProperty(exports, "sprintf", {
  enumerable: true,
  get: function () {
    return _sprintf.sprintf;
  }
});
Object.defineProperty(exports, "subscribe", {
  enumerable: true,
  get: function () {
    return _defaultI18n.subscribe;
  }
});

var _sprintf = require("./sprintf");

var _createI18n = require("./create-i18n");

Object.keys(_createI18n).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _createI18n[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _createI18n[key];
    }
  });
});

var _defaultI18n = _interopRequireWildcard(require("./default-i18n"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

},{"./create-i18n":17,"./default-i18n":18,"./sprintf":20}],20:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sprintf = sprintf;

var _memize = _interopRequireDefault(require("memize"));

var _sprintfJs = _interopRequireDefault(require("sprintf-js"));

/**
 * External dependencies
 */

/**
 * Log to console, once per message; or more precisely, per referentially equal
 * argument set. Because Jed throws errors, we log these to the console instead
 * to avoid crashing the application.
 *
 * @param {...*} args Arguments to pass to `console.error`
 */
const logErrorOnce = (0, _memize.default)(console.error); // eslint-disable-line no-console

/**
 * Returns a formatted string. If an error occurs in applying the format, the
 * original format string is returned.
 *
 * @param {string} format The format of the string to generate.
 * @param {...*}   args   Arguments to apply to the format.
 *
 * @see https://www.npmjs.com/package/sprintf-js
 *
 * @return {string} The formatted string.
 */

function sprintf(format) {
  try {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return _sprintfJs.default.sprintf(format, ...args);
  } catch (error) {
    if (error instanceof Error) {
      logErrorOnce('sprintf error: \n\n' + error.toString());
    }

    return format;
  }
}

},{"@babel/runtime/helpers/interopRequireDefault":1,"memize":21,"sprintf-js":23}],21:[function(require,module,exports){
(function (process){(function (){
/**
 * Memize options object.
 *
 * @typedef MemizeOptions
 *
 * @property {number} [maxSize] Maximum size of the cache.
 */

/**
 * Internal cache entry.
 *
 * @typedef MemizeCacheNode
 *
 * @property {?MemizeCacheNode|undefined} [prev] Previous node.
 * @property {?MemizeCacheNode|undefined} [next] Next node.
 * @property {Array<*>}                   args   Function arguments for cache
 *                                               entry.
 * @property {*}                          val    Function result.
 */

/**
 * Properties of the enhanced function for controlling cache.
 *
 * @typedef MemizeMemoizedFunction
 *
 * @property {()=>void} clear Clear the cache.
 */

/**
 * Accepts a function to be memoized, and returns a new memoized function, with
 * optional options.
 *
 * @template {Function} F
 *
 * @param {F}             fn        Function to memoize.
 * @param {MemizeOptions} [options] Options object.
 *
 * @return {F & MemizeMemoizedFunction} Memoized function.
 */
function memize( fn, options ) {
	var size = 0;

	/** @type {?MemizeCacheNode|undefined} */
	var head;

	/** @type {?MemizeCacheNode|undefined} */
	var tail;

	options = options || {};

	function memoized( /* ...args */ ) {
		var node = head,
			len = arguments.length,
			args, i;

		searchCache: while ( node ) {
			// Perform a shallow equality test to confirm that whether the node
			// under test is a candidate for the arguments passed. Two arrays
			// are shallowly equal if their length matches and each entry is
			// strictly equal between the two sets. Avoid abstracting to a
			// function which could incur an arguments leaking deoptimization.

			// Check whether node arguments match arguments length
			if ( node.args.length !== arguments.length ) {
				node = node.next;
				continue;
			}

			// Check whether node arguments match arguments values
			for ( i = 0; i < len; i++ ) {
				if ( node.args[ i ] !== arguments[ i ] ) {
					node = node.next;
					continue searchCache;
				}
			}

			// At this point we can assume we've found a match

			// Surface matched node to head if not already
			if ( node !== head ) {
				// As tail, shift to previous. Must only shift if not also
				// head, since if both head and tail, there is no previous.
				if ( node === tail ) {
					tail = node.prev;
				}

				// Adjust siblings to point to each other. If node was tail,
				// this also handles new tail's empty `next` assignment.
				/** @type {MemizeCacheNode} */ ( node.prev ).next = node.next;
				if ( node.next ) {
					node.next.prev = node.prev;
				}

				node.next = head;
				node.prev = null;
				/** @type {MemizeCacheNode} */ ( head ).prev = node;
				head = node;
			}

			// Return immediately
			return node.val;
		}

		// No cached value found. Continue to insertion phase:

		// Create a copy of arguments (avoid leaking deoptimization)
		args = new Array( len );
		for ( i = 0; i < len; i++ ) {
			args[ i ] = arguments[ i ];
		}

		node = {
			args: args,

			// Generate the result from original function
			val: fn.apply( null, args ),
		};

		// Don't need to check whether node is already head, since it would
		// have been returned above already if it was

		// Shift existing head down list
		if ( head ) {
			head.prev = node;
			node.next = head;
		} else {
			// If no head, follows that there's no tail (at initial or reset)
			tail = node;
		}

		// Trim tail if we're reached max size and are pending cache insertion
		if ( size === /** @type {MemizeOptions} */ ( options ).maxSize ) {
			tail = /** @type {MemizeCacheNode} */ ( tail ).prev;
			/** @type {MemizeCacheNode} */ ( tail ).next = null;
		} else {
			size++;
		}

		head = node;

		return node.val;
	}

	memoized.clear = function() {
		head = null;
		tail = null;
		size = 0;
	};

	if ( process.env.NODE_ENV === 'test' ) {
		// Cache is not exposed in the public API, but used in tests to ensure
		// expected list progression
		memoized.getCache = function() {
			return [ head, tail, size ];
		};
	}

	// Ignore reason: There's not a clear solution to create an intersection of
	// the function with additional properties, where the goal is to retain the
	// function signature of the incoming argument and add control properties
	// on the return value.

	// @ts-ignore
	return memoized;
}

module.exports = memize;

}).call(this)}).call(this,require('_process'))

},{"_process":22}],22:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],23:[function(require,module,exports){
/* global window, exports, define */

!function() {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/
    }

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i]
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i] // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                        }
                        arg = arg[ph.keys[k]]
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg()
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2)
                        break
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10))
                        break
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10)
                        break
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                        break
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                        break
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                        break
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                        break
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8)
                        break
                    case 's':
                        arg = String(arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 't':
                        arg = String(!!arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0
                        break
                    case 'v':
                        arg = arg.valueOf()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16)
                        break
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
                        break
                }
                if (re.json.test(ph.type)) {
                    output += arg
                }
                else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-'
                        arg = arg.toString().replace(re.sign, '')
                    }
                    else {
                        sign = ''
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
                    pad_length = ph.width - (sign + arg).length
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null)

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%')
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1])
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }

                parse_tree.push(
                    {
                        placeholder: match[0],
                        param_no:    match[1],
                        keys:        match[2],
                        sign:        match[3],
                        pad_char:    match[4],
                        align:       match[5],
                        width:       match[6],
                        precision:   match[7],
                        type:        match[8]
                    }
                )
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return sprintf_cache[fmt] = parse_tree
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    if (typeof exports !== 'undefined') {
        exports['sprintf'] = sprintf
        exports['vsprintf'] = vsprintf
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf
        window['vsprintf'] = vsprintf

        if (typeof define === 'function' && define['amd']) {
            define(function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            })
        }
    }
    /* eslint-enable quote-props */
}(); // eslint-disable-line

},{}],24:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var pluralForms = _interopDefault(require('@tannin/plural-forms'));

/**
 * Tannin constructor options.
 *
 * @typedef {Object} TanninOptions
 *
 * @property {string}   [contextDelimiter] Joiner in string lookup with context.
 * @property {Function} [onMissingKey]     Callback to invoke when key missing.
 */

/**
 * Domain metadata.
 *
 * @typedef {Object} TanninDomainMetadata
 *
 * @property {string}            [domain]       Domain name.
 * @property {string}            [lang]         Language code.
 * @property {(string|Function)} [plural_forms] Plural forms expression or
 *                                              function evaluator.
 */

/**
 * Domain translation pair respectively representing the singular and plural
 * translation.
 *
 * @typedef {[string,string]} TanninTranslation
 */

/**
 * Locale data domain. The key is used as reference for lookup, the value an
 * array of two string entries respectively representing the singular and plural
 * translation.
 *
 * @typedef {{[key:string]:TanninDomainMetadata|TanninTranslation,'':TanninDomainMetadata|TanninTranslation}} TanninLocaleDomain
 */

/**
 * Jed-formatted locale data.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @typedef {{[domain:string]:TanninLocaleDomain}} TanninLocaleData
 */

/**
 * Default Tannin constructor options.
 *
 * @type {TanninOptions}
 */
var DEFAULT_OPTIONS = {
	contextDelimiter: '\u0004',
	onMissingKey: null,
};

/**
 * Given a specific locale data's config `plural_forms` value, returns the
 * expression.
 *
 * @example
 *
 * ```
 * getPluralExpression( 'nplurals=2; plural=(n != 1);' ) === '(n != 1)'
 * ```
 *
 * @param {string} pf Locale data plural forms.
 *
 * @return {string} Plural forms expression.
 */
function getPluralExpression( pf ) {
	var parts, i, part;

	parts = pf.split( ';' );

	for ( i = 0; i < parts.length; i++ ) {
		part = parts[ i ].trim();
		if ( part.indexOf( 'plural=' ) === 0 ) {
			return part.substr( 7 );
		}
	}
}

/**
 * Tannin constructor.
 *
 * @class
 *
 * @param {TanninLocaleData} data      Jed-formatted locale data.
 * @param {TanninOptions}    [options] Tannin options.
 */
function Tannin( data, options ) {
	var key;

	/**
	 * Jed-formatted locale data.
	 *
	 * @name Tannin#data
	 * @type {TanninLocaleData}
	 */
	this.data = data;

	/**
	 * Plural forms function cache, keyed by plural forms string.
	 *
	 * @name Tannin#pluralForms
	 * @type {Object<string,Function>}
	 */
	this.pluralForms = {};

	/**
	 * Effective options for instance, including defaults.
	 *
	 * @name Tannin#options
	 * @type {TanninOptions}
	 */
	this.options = {};

	for ( key in DEFAULT_OPTIONS ) {
		this.options[ key ] = options !== undefined && key in options
			? options[ key ]
			: DEFAULT_OPTIONS[ key ];
	}
}

/**
 * Returns the plural form index for the given domain and value.
 *
 * @param {string} domain Domain on which to calculate plural form.
 * @param {number} n      Value for which plural form is to be calculated.
 *
 * @return {number} Plural form index.
 */
Tannin.prototype.getPluralForm = function( domain, n ) {
	var getPluralForm = this.pluralForms[ domain ],
		config, plural, pf;

	if ( ! getPluralForm ) {
		config = this.data[ domain ][ '' ];

		pf = (
			config[ 'Plural-Forms' ] ||
			config[ 'plural-forms' ] ||
			// Ignore reason: As known, there's no way to document the empty
			// string property on a key to guarantee this as metadata.
			// @ts-ignore
			config.plural_forms
		);

		if ( typeof pf !== 'function' ) {
			plural = getPluralExpression(
				config[ 'Plural-Forms' ] ||
				config[ 'plural-forms' ] ||
				// Ignore reason: As known, there's no way to document the empty
				// string property on a key to guarantee this as metadata.
				// @ts-ignore
				config.plural_forms
			);

			pf = pluralForms( plural );
		}

		getPluralForm = this.pluralForms[ domain ] = pf;
	}

	return getPluralForm( n );
};

/**
 * Translate a string.
 *
 * @param {string}      domain   Translation domain.
 * @param {string|void} context  Context distinguishing terms of the same name.
 * @param {string}      singular Primary key for translation lookup.
 * @param {string=}     plural   Fallback value used for non-zero plural
 *                               form index.
 * @param {number=}     n        Value to use in calculating plural form.
 *
 * @return {string} Translated string.
 */
Tannin.prototype.dcnpgettext = function( domain, context, singular, plural, n ) {
	var index, key, entry;

	if ( n === undefined ) {
		// Default to singular.
		index = 0;
	} else {
		// Find index by evaluating plural form for value.
		index = this.getPluralForm( domain, n );
	}

	key = singular;

	// If provided, context is prepended to key with delimiter.
	if ( context ) {
		key = context + this.options.contextDelimiter + singular;
	}

	entry = this.data[ domain ][ key ];

	// Verify not only that entry exists, but that the intended index is within
	// range and non-empty.
	if ( entry && entry[ index ] ) {
		return entry[ index ];
	}

	if ( this.options.onMissingKey ) {
		this.options.onMissingKey( singular, domain );
	}

	// If entry not found, fall back to singular vs. plural with zero index
	// representing the singular value.
	return index === 0 ? singular : plural;
};

module.exports = Tannin;

},{"@tannin/plural-forms":4}],25:[function(require,module,exports){
"use strict";

var _i18n = require("@wordpress/i18n");
/**
 * lci-post-slider ACF Block Javascrip entry point.
 *
 * @package lci-post-slider
 */

/**
 * WordPress i18n
 *
 * __( '__', 'my-domain' );
 * _x( '_x', '_x_context', 'my-domain' );
 * _n( '_n_single', '_n_plural', number, 'my-domain' );
 * _nx( '_nx_single', '_nx_plural', number, '_nx_context', 'my-domain' );
 */
// require using babel + installing @wordpress/i18n npm packages

(function () {
  // i18n when not using babel. No need to install @wordpress/i18n npm packages then
  // const { __, _x, _n, _nx } = wp.i18n;

  // DO NOT USE variable textDomain in i18n function or wp-cli i18n make-pot command wont find translations
  // const textDomain = "lci-post-slider";

  /**
   * Check if DOM is already available to launch script or add event listener to do so as soon as possible
   * https://stackoverflow.com/a/9899701
   */
  let docReady = fn => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      // call on next available tick
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };
  docReady(function () {
    // DOM is loaded and ready for manipulation here
    console.log((0, _i18n.__)("lci-post-slider.js started !", "lci-post-slider"));
    try {
      // Get flickity sliders and initialize them
      let sliders = document.querySelectorAll(".lci-post-slider")

      // If we use babel
      ;
      [...sliders].forEach(slider => {
        initializeBlock(slider);
      });

      // If not using babel
      // for (var i = 0, len = sliders.length; i < len; i++) {
      //   initializeBlock(sliders[i]);
      // }
    } catch (error) {
      console.error(e);
    }
  });

  /**
   * initializeBlock
   *
   * @param   object $block The block element.
   * @return  void
   */
  let initializeBlock = function ($block) {
    try {
      let post_slider_container = $block.querySelector(".lci-post-slider-container");
      post_slider_container.classList.remove("is-hidden");
      // trigger redraw for transition
      post_slider_container.offsetHeight;
      if (post_slider_container) {
        let options = {
          initialIndex: 1,
          imagesLoaded: true,
          // re-positions cells once their images have loaded
          groupCells: true,
          // group cells that fit in carousel viewport
          cellAlign: post_slider_container.dataset.cellalign,
          // left, right, center
          freeScroll: false,
          // enables content to be freely scrolled and flicked without aligning cells to an end position
          wrapAround: post_slider_container.dataset.wraparound === "true"
          // watchCSS: true
          // enable Flickity in CSS when
          // element:after { content: 'flickity' }
        };

        // console.log(options);

        let slider = new Flickity(post_slider_container, options);
      }
      // else {
      //   // slider empty or flickity-slider render template is missing div.post_slider_container
      // }
    } catch (e) {
      console.error(e, $block);
    }
  };

  // ACF Javascript API
  if (window.acf) {
    window.acf.addAction(
    // Initialize dynamic block preview (editor).
    // If namespace is other than “acf/” use the full block name in the callback, so: render_block_preview/type=namespace/lci-post-slider
    "render_block_preview/type=lci-post-slider", $block => {
      // console.log("render event!");

      // Trigger editor preview refresh on block's props update
      initializeBlock($block[0]);

      // Trigger flickity refresh on block's props update
      window.dispatchEvent(new Event("resize"));
    });
  }
})();

},{"@wordpress/i18n":19}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHQuanMiLCJub2RlX21vZHVsZXMvQHRhbm5pbi9jb21waWxlL2J1aWxkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0YW5uaW4vZXZhbHVhdGUvYnVpbGQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRhbm5pbi9wbHVyYWwtZm9ybXMvYnVpbGQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRhbm5pbi9wb3N0Zml4L2J1aWxkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaG9va3MvYnVpbGQvY3JlYXRlQWRkSG9vay5qcyIsIm5vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2hvb2tzL2J1aWxkL2NyZWF0ZUN1cnJlbnRIb29rLmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaG9va3MvYnVpbGQvY3JlYXRlRGlkSG9vay5qcyIsIm5vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2hvb2tzL2J1aWxkL2NyZWF0ZURvaW5nSG9vay5qcyIsIm5vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2hvb2tzL2J1aWxkL2NyZWF0ZUhhc0hvb2suanMiLCJub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9ob29rcy9idWlsZC9jcmVhdGVIb29rcy5qcyIsIm5vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2hvb2tzL2J1aWxkL2NyZWF0ZVJlbW92ZUhvb2suanMiLCJub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9ob29rcy9idWlsZC9jcmVhdGVSdW5Ib29rLmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaG9va3MvYnVpbGQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9ob29rcy9idWlsZC92YWxpZGF0ZUhvb2tOYW1lLmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaG9va3MvYnVpbGQvdmFsaWRhdGVOYW1lc3BhY2UuanMiLCJub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9pMThuL2J1aWxkL2NyZWF0ZS1pMThuLmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaTE4bi9idWlsZC9kZWZhdWx0LWkxOG4uanMiLCJub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9pMThuL2J1aWxkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvaTE4bi9idWlsZC9zcHJpbnRmLmpzIiwibm9kZV9tb2R1bGVzL21lbWl6ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvc3ByaW50Zi1qcy9zcmMvc3ByaW50Zi5qcyIsIm5vZGVfbW9kdWxlcy90YW5uaW4vYnVpbGQvaW5kZXguanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVNQTtBQWZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVDLENBQUMsWUFBWTtFQUNaO0VBQ0E7O0VBRUE7RUFDQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNFLElBQUksUUFBUSxHQUFHLEVBQUUsSUFBSTtJQUNuQixJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssVUFBVSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssYUFBYSxFQUFFO01BQy9FO01BQ0EsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbkIsQ0FBQyxNQUFNO01BQ0wsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQztJQUNuRDtFQUNGLENBQUM7RUFFRCxRQUFRLENBQUMsWUFBWTtJQUNuQjtJQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBQSxRQUFFLEVBQUMsOEJBQThCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUNsRSxJQUFJO01BQ0Y7TUFDQSxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCOztNQUUxRDtNQUFBO01BQ0MsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUk7UUFDOUIsZUFBZSxDQUFDLE1BQU0sQ0FBQztNQUN6QixDQUFDLENBQUM7O01BRUY7TUFDQTtNQUNBO01BQ0E7SUFDRixDQUFDLENBQUMsT0FBTyxLQUFLLEVBQUU7TUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNsQjtFQUNGLENBQUMsQ0FBQzs7RUFFRjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxJQUFJLGVBQWUsR0FBRyxVQUFVLE1BQU0sRUFBRTtJQUN0QyxJQUFJO01BQ0YsSUFBSSxxQkFBcUIsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLDRCQUE0QixDQUFDO01BRTlFLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO01BQ25EO01BQ0EscUJBQXFCLENBQUMsWUFBWTtNQUVsQyxJQUFJLHFCQUFxQixFQUFFO1FBQ3pCLElBQUksT0FBTyxHQUFHO1VBQ1osWUFBWSxFQUFFLENBQUM7VUFDZixZQUFZLEVBQUUsSUFBSTtVQUFFO1VBQ3BCLFVBQVUsRUFBRSxJQUFJO1VBQUU7VUFDbEIsU0FBUyxFQUFFLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxTQUFTO1VBQUU7VUFDcEQsVUFBVSxFQUFFLEtBQUs7VUFBRTtVQUNuQixVQUFVLEVBQUUscUJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSztVQUN6RDtVQUNBO1VBQ0E7UUFDRixDQUFDOztRQUVEOztRQUVBLElBQUksTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLHFCQUFxQixFQUFFLE9BQU8sQ0FBQztNQUMzRDtNQUNBO01BQ0E7TUFDQTtJQUNGLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRTtNQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQztJQUMxQjtFQUNGLENBQUM7O0VBRUQ7RUFDQSxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUU7SUFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVM7SUFDbEI7SUFDQTtJQUNBLDJDQUEyQyxFQUMzQyxNQUFNLElBQUk7TUFDUjs7TUFFQTtNQUNBLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O01BRTFCO01BQ0EsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQ0Y7RUFDSDtBQUNGLENBQUMsR0FBRyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7XG4gIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7XG4gICAgXCJkZWZhdWx0XCI6IG9ialxuICB9O1xufVxubW9kdWxlLmV4cG9ydHMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0LCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZSwgbW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHM7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcERlZmF1bHQgKGV4KSB7IHJldHVybiAoZXggJiYgKHR5cGVvZiBleCA9PT0gJ29iamVjdCcpICYmICdkZWZhdWx0JyBpbiBleCkgPyBleFsnZGVmYXVsdCddIDogZXg7IH1cblxudmFyIHBvc3RmaXggPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQHRhbm5pbi9wb3N0Zml4JykpO1xudmFyIGV2YWx1YXRlID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0B0YW5uaW4vZXZhbHVhdGUnKSk7XG5cbi8qKlxuICogR2l2ZW4gYSBDIGV4cHJlc3Npb24sIHJldHVybnMgYSBmdW5jdGlvbiB3aGljaCBjYW4gYmUgY2FsbGVkIHRvIGV2YWx1YXRlIGl0c1xuICogcmVzdWx0LlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBjb21waWxlIGZyb20gJ0B0YW5uaW4vY29tcGlsZSc7XG4gKlxuICogY29uc3QgZXZhbHVhdGUgPSBjb21waWxlKCAnbiA+IDEnICk7XG4gKlxuICogZXZhbHVhdGUoIHsgbjogMiB9ICk7XG4gKiAvLyDih5IgdHJ1ZVxuICogYGBgXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV4cHJlc3Npb24gQyBleHByZXNzaW9uLlxuICpcbiAqIEByZXR1cm4geyh2YXJpYWJsZXM/OntbdmFyaWFibGU6c3RyaW5nXToqfSk9Pip9IENvbXBpbGVkIGV2YWx1YXRvci5cbiAqL1xuZnVuY3Rpb24gY29tcGlsZSggZXhwcmVzc2lvbiApIHtcblx0dmFyIHRlcm1zID0gcG9zdGZpeCggZXhwcmVzc2lvbiApO1xuXG5cdHJldHVybiBmdW5jdGlvbiggdmFyaWFibGVzICkge1xuXHRcdHJldHVybiBldmFsdWF0ZSggdGVybXMsIHZhcmlhYmxlcyApO1xuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBpbGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogT3BlcmF0b3IgY2FsbGJhY2sgZnVuY3Rpb25zLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBPUEVSQVRPUlMgPSB7XG5cdCchJzogZnVuY3Rpb24oIGEgKSB7XG5cdFx0cmV0dXJuICEgYTtcblx0fSxcblx0JyonOiBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gYSAqIGI7XG5cdH0sXG5cdCcvJzogZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEgLyBiO1xuXHR9LFxuXHQnJSc6IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiBhICUgYjtcblx0fSxcblx0JysnOiBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gYSArIGI7XG5cdH0sXG5cdCctJzogZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEgLSBiO1xuXHR9LFxuXHQnPCc6IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiBhIDwgYjtcblx0fSxcblx0Jzw9JzogZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEgPD0gYjtcblx0fSxcblx0Jz4nOiBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gYSA+IGI7XG5cdH0sXG5cdCc+PSc6IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiBhID49IGI7XG5cdH0sXG5cdCc9PSc6IGZ1bmN0aW9uKCBhLCBiICkge1xuXHRcdHJldHVybiBhID09PSBiO1xuXHR9LFxuXHQnIT0nOiBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRyZXR1cm4gYSAhPT0gYjtcblx0fSxcblx0JyYmJzogZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEgJiYgYjtcblx0fSxcblx0J3x8JzogZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEgfHwgYjtcblx0fSxcblx0Jz86JzogZnVuY3Rpb24oIGEsIGIsIGMgKSB7XG5cdFx0aWYgKCBhICkge1xuXHRcdFx0dGhyb3cgYjtcblx0XHR9XG5cblx0XHRyZXR1cm4gYztcblx0fSxcbn07XG5cbi8qKlxuICogR2l2ZW4gYW4gYXJyYXkgb2YgcG9zdGZpeCB0ZXJtcyBhbmQgb3BlcmFuZCB2YXJpYWJsZXMsIHJldHVybnMgdGhlIHJlc3VsdCBvZlxuICogdGhlIHBvc3RmaXggZXZhbHVhdGlvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZXZhbHVhdGUgZnJvbSAnQHRhbm5pbi9ldmFsdWF0ZSc7XG4gKlxuICogLy8gMyArIDQgKiA1IC8gNiDih5IgJzMgNCA1ICogNiAvICsnXG4gKiBjb25zdCB0ZXJtcyA9IFsgJzMnLCAnNCcsICc1JywgJyonLCAnNicsICcvJywgJysnIF07XG4gKlxuICogZXZhbHVhdGUoIHRlcm1zLCB7fSApO1xuICogLy8g4oeSIDYuMzMzMzMzMzMzMzMzMzM0XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBwb3N0Zml4ICAgUG9zdGZpeCB0ZXJtcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSAgIHZhcmlhYmxlcyBPcGVyYW5kIHZhcmlhYmxlcy5cbiAqXG4gKiBAcmV0dXJuIHsqfSBSZXN1bHQgb2YgZXZhbHVhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZXZhbHVhdGUoIHBvc3RmaXgsIHZhcmlhYmxlcyApIHtcblx0dmFyIHN0YWNrID0gW10sXG5cdFx0aSwgaiwgYXJncywgZ2V0T3BlcmF0b3JSZXN1bHQsIHRlcm0sIHZhbHVlO1xuXG5cdGZvciAoIGkgPSAwOyBpIDwgcG9zdGZpeC5sZW5ndGg7IGkrKyApIHtcblx0XHR0ZXJtID0gcG9zdGZpeFsgaSBdO1xuXG5cdFx0Z2V0T3BlcmF0b3JSZXN1bHQgPSBPUEVSQVRPUlNbIHRlcm0gXTtcblx0XHRpZiAoIGdldE9wZXJhdG9yUmVzdWx0ICkge1xuXHRcdFx0Ly8gUG9wIGZyb20gc3RhY2sgYnkgbnVtYmVyIG9mIGZ1bmN0aW9uIGFyZ3VtZW50cy5cblx0XHRcdGogPSBnZXRPcGVyYXRvclJlc3VsdC5sZW5ndGg7XG5cdFx0XHRhcmdzID0gQXJyYXkoIGogKTtcblx0XHRcdHdoaWxlICggai0tICkge1xuXHRcdFx0XHRhcmdzWyBqIF0gPSBzdGFjay5wb3AoKTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dmFsdWUgPSBnZXRPcGVyYXRvclJlc3VsdC5hcHBseSggbnVsbCwgYXJncyApO1xuXHRcdFx0fSBjYXRjaCAoIGVhcmx5UmV0dXJuICkge1xuXHRcdFx0XHRyZXR1cm4gZWFybHlSZXR1cm47XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICggdmFyaWFibGVzLmhhc093blByb3BlcnR5KCB0ZXJtICkgKSB7XG5cdFx0XHR2YWx1ZSA9IHZhcmlhYmxlc1sgdGVybSBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YWx1ZSA9ICt0ZXJtO1xuXHRcdH1cblxuXHRcdHN0YWNrLnB1c2goIHZhbHVlICk7XG5cdH1cblxuXHRyZXR1cm4gc3RhY2tbIDAgXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmFsdWF0ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0IChleCkgeyByZXR1cm4gKGV4ICYmICh0eXBlb2YgZXggPT09ICdvYmplY3QnKSAmJiAnZGVmYXVsdCcgaW4gZXgpID8gZXhbJ2RlZmF1bHQnXSA6IGV4OyB9XG5cbnZhciBjb21waWxlID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0B0YW5uaW4vY29tcGlsZScpKTtcblxuLyoqXG4gKiBHaXZlbiBhIEMgZXhwcmVzc2lvbiwgcmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGNhbGxlZCB3aXRoIGEgdmFsdWUsXG4gKiBldmFsdWF0ZXMgdGhlIHJlc3VsdCB3aXRoIHRoZSB2YWx1ZSBhc3N1bWVkIHRvIGJlIHRoZSBcIm5cIiB2YXJpYWJsZSBvZiB0aGVcbiAqIGV4cHJlc3Npb24uIFRoZSByZXN1bHQgd2lsbCBiZSBjb2VyY2VkIHRvIGl0cyBudW1lcmljIGVxdWl2YWxlbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV4cHJlc3Npb24gQyBleHByZXNzaW9uLlxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBFdmFsdWF0b3IgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHBsdXJhbEZvcm1zKCBleHByZXNzaW9uICkge1xuXHR2YXIgZXZhbHVhdGUgPSBjb21waWxlKCBleHByZXNzaW9uICk7XG5cblx0cmV0dXJuIGZ1bmN0aW9uKCBuICkge1xuXHRcdHJldHVybiArZXZhbHVhdGUoIHsgbjogbiB9ICk7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGx1cmFsRm9ybXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQUkVDRURFTkNFLCBPUEVORVJTLCBURVJNSU5BVE9SUywgUEFUVEVSTjtcblxuLyoqXG4gKiBPcGVyYXRvciBwcmVjZWRlbmNlIG1hcHBpbmcuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuUFJFQ0VERU5DRSA9IHtcblx0JygnOiA5LFxuXHQnISc6IDgsXG5cdCcqJzogNyxcblx0Jy8nOiA3LFxuXHQnJSc6IDcsXG5cdCcrJzogNixcblx0Jy0nOiA2LFxuXHQnPCc6IDUsXG5cdCc8PSc6IDUsXG5cdCc+JzogNSxcblx0Jz49JzogNSxcblx0Jz09JzogNCxcblx0JyE9JzogNCxcblx0JyYmJzogMyxcblx0J3x8JzogMixcblx0Jz8nOiAxLFxuXHQnPzonOiAxLFxufTtcblxuLyoqXG4gKiBDaGFyYWN0ZXJzIHdoaWNoIHNpZ25hbCBwYWlyIG9wZW5pbmcsIHRvIGJlIHRlcm1pbmF0ZWQgYnkgdGVybWluYXRvcnMuXG4gKlxuICogQHR5cGUge3N0cmluZ1tdfVxuICovXG5PUEVORVJTID0gWyAnKCcsICc/JyBdO1xuXG4vKipcbiAqIENoYXJhY3RlcnMgd2hpY2ggc2lnbmFsIHBhaXIgdGVybWluYXRpb24sIHRoZSB2YWx1ZSBhbiBhcnJheSB3aXRoIHRoZVxuICogb3BlbmVyIGFzIGl0cyBmaXJzdCBtZW1iZXIuIFRoZSBzZWNvbmQgbWVtYmVyIGlzIGFuIG9wdGlvbmFsIG9wZXJhdG9yXG4gKiByZXBsYWNlbWVudCB0byBwdXNoIHRvIHRoZSBzdGFjay5cbiAqXG4gKiBAdHlwZSB7c3RyaW5nW119XG4gKi9cblRFUk1JTkFUT1JTID0ge1xuXHQnKSc6IFsgJygnIF0sXG5cdCc6JzogWyAnPycsICc/OicgXSxcbn07XG5cbi8qKlxuICogUGF0dGVybiBtYXRjaGluZyBvcGVyYXRvcnMgYW5kIG9wZW5lcnMuXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xuUEFUVEVSTiA9IC88PXw+PXw9PXwhPXwmJnxcXHxcXHx8XFw/OnxcXCh8IXxcXCp8XFwvfCV8XFwrfC18PHw+fFxcP3xcXCl8Oi87XG5cbi8qKlxuICogR2l2ZW4gYSBDIGV4cHJlc3Npb24sIHJldHVybnMgdGhlIGVxdWl2YWxlbnQgcG9zdGZpeCAoUmV2ZXJzZSBQb2xpc2gpXG4gKiBub3RhdGlvbiB0ZXJtcyBhcyBhbiBhcnJheS5cbiAqXG4gKiBJZiBhIHBvc3RmaXggc3RyaW5nIGlzIGRlc2lyZWQsIHNpbXBseSBgLmpvaW4oICcgJyApYCB0aGUgcmVzdWx0LlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBwb3N0Zml4IGZyb20gJ0B0YW5uaW4vcG9zdGZpeCc7XG4gKlxuICogcG9zdGZpeCggJ24gPiAxJyApO1xuICogLy8g4oeSIFsgJ24nLCAnMScsICc+JyBdXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXhwcmVzc2lvbiBDIGV4cHJlc3Npb24uXG4gKlxuICogQHJldHVybiB7c3RyaW5nW119IFBvc3RmaXggdGVybXMuXG4gKi9cbmZ1bmN0aW9uIHBvc3RmaXgoIGV4cHJlc3Npb24gKSB7XG5cdHZhciB0ZXJtcyA9IFtdLFxuXHRcdHN0YWNrID0gW10sXG5cdFx0bWF0Y2gsIG9wZXJhdG9yLCB0ZXJtLCBlbGVtZW50O1xuXG5cdHdoaWxlICggKCBtYXRjaCA9IGV4cHJlc3Npb24ubWF0Y2goIFBBVFRFUk4gKSApICkge1xuXHRcdG9wZXJhdG9yID0gbWF0Y2hbIDAgXTtcblxuXHRcdC8vIFRlcm0gaXMgdGhlIHN0cmluZyBwcmVjZWRpbmcgdGhlIG9wZXJhdG9yIG1hdGNoLiBJdCBtYXkgY29udGFpblxuXHRcdC8vIHdoaXRlc3BhY2UsIGFuZCBtYXkgYmUgZW1wdHkgKGlmIG9wZXJhdG9yIGlzIGF0IGJlZ2lubmluZykuXG5cdFx0dGVybSA9IGV4cHJlc3Npb24uc3Vic3RyKCAwLCBtYXRjaC5pbmRleCApLnRyaW0oKTtcblx0XHRpZiAoIHRlcm0gKSB7XG5cdFx0XHR0ZXJtcy5wdXNoKCB0ZXJtICk7XG5cdFx0fVxuXG5cdFx0d2hpbGUgKCAoIGVsZW1lbnQgPSBzdGFjay5wb3AoKSApICkge1xuXHRcdFx0aWYgKCBURVJNSU5BVE9SU1sgb3BlcmF0b3IgXSApIHtcblx0XHRcdFx0aWYgKCBURVJNSU5BVE9SU1sgb3BlcmF0b3IgXVsgMCBdID09PSBlbGVtZW50ICkge1xuXHRcdFx0XHRcdC8vIFN1YnN0aXR1dGlvbiB3b3JrcyBoZXJlIHVuZGVyIGFzc3VtcHRpb24gdGhhdCBiZWNhdXNlXG5cdFx0XHRcdFx0Ly8gdGhlIGFzc2lnbmVkIG9wZXJhdG9yIHdpbGwgbm8gbG9uZ2VyIGJlIGEgdGVybWluYXRvciwgaXRcblx0XHRcdFx0XHQvLyB3aWxsIGJlIHB1c2hlZCB0byB0aGUgc3RhY2sgZHVyaW5nIHRoZSBjb25kaXRpb24gYmVsb3cuXG5cdFx0XHRcdFx0b3BlcmF0b3IgPSBURVJNSU5BVE9SU1sgb3BlcmF0b3IgXVsgMSBdIHx8IG9wZXJhdG9yO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKCBPUEVORVJTLmluZGV4T2YoIGVsZW1lbnQgKSA+PSAwIHx8IFBSRUNFREVOQ0VbIGVsZW1lbnQgXSA8IFBSRUNFREVOQ0VbIG9wZXJhdG9yIF0gKSB7XG5cdFx0XHRcdC8vIFB1c2ggdG8gc3RhY2sgaWYgZWl0aGVyIGFuIG9wZW5lciBvciB3aGVuIHBvcCByZXZlYWxzIGFuXG5cdFx0XHRcdC8vIGVsZW1lbnQgb2YgbG93ZXIgcHJlY2VkZW5jZS5cblx0XHRcdFx0c3RhY2sucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Ly8gRm9yIGVhY2ggcG9wcGVkIGZyb20gc3RhY2ssIHB1c2ggdG8gdGVybXMuXG5cdFx0XHR0ZXJtcy5wdXNoKCBlbGVtZW50ICk7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIFRFUk1JTkFUT1JTWyBvcGVyYXRvciBdICkge1xuXHRcdFx0c3RhY2sucHVzaCggb3BlcmF0b3IgKTtcblx0XHR9XG5cblx0XHQvLyBTbGljZSBtYXRjaGVkIGZyYWdtZW50IGZyb20gZXhwcmVzc2lvbiB0byBjb250aW51ZSBtYXRjaC5cblx0XHRleHByZXNzaW9uID0gZXhwcmVzc2lvbi5zdWJzdHIoIG1hdGNoLmluZGV4ICsgb3BlcmF0b3IubGVuZ3RoICk7XG5cdH1cblxuXHQvLyBQdXNoIHJlbWFpbmRlciBvZiBvcGVyYW5kLCBpZiBleGlzdHMsIHRvIHRlcm1zLlxuXHRleHByZXNzaW9uID0gZXhwcmVzc2lvbi50cmltKCk7XG5cdGlmICggZXhwcmVzc2lvbiApIHtcblx0XHR0ZXJtcy5wdXNoKCBleHByZXNzaW9uICk7XG5cdH1cblxuXHQvLyBQb3AgcmVtYWluaW5nIGl0ZW1zIGZyb20gc3RhY2sgaW50byB0ZXJtcy5cblx0cmV0dXJuIHRlcm1zLmNvbmNhdCggc3RhY2sucmV2ZXJzZSgpICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcG9zdGZpeDtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2ludGVyb3BSZXF1aXJlRGVmYXVsdFwiKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcblxudmFyIF92YWxpZGF0ZU5hbWVzcGFjZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vdmFsaWRhdGVOYW1lc3BhY2UuanNcIikpO1xuXG52YXIgX3ZhbGlkYXRlSG9va05hbWUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3ZhbGlkYXRlSG9va05hbWUuanNcIikpO1xuXG4vKipcbiAqIEludGVybmFsIGRlcGVuZGVuY2llc1xuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIEFkZEhvb2tcbiAqXG4gKiBBZGRzIHRoZSBob29rIHRvIHRoZSBhcHByb3ByaWF0ZSBob29rcyBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgaG9va05hbWUgICAgICBOYW1lIG9mIGhvb2sgdG8gYWRkXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICBuYW1lc3BhY2UgICAgIFRoZSB1bmlxdWUgbmFtZXNwYWNlIGlkZW50aWZ5aW5nIHRoZSBjYWxsYmFjayBpbiB0aGUgZm9ybSBgdmVuZG9yL3BsdWdpbi9mdW5jdGlvbmAuXG4gKiBAcGFyYW0ge2ltcG9ydCgnLicpLkNhbGxiYWNrfSBjYWxsYmFjayAgICAgIEZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUgaG9vayBpcyBydW5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgICAgICAgICAgICAgIFtwcmlvcml0eT0xMF0gUHJpb3JpdHkgb2YgdGhpcyBob29rXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gaW52b2tlZCwgd2lsbCBhZGQgYSBob29rLlxuICpcbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuSG9va3N9ICAgIGhvb2tzICAgIEhvb2tzIGluc3RhbmNlLlxuICogQHBhcmFtIHtpbXBvcnQoJy4nKS5TdG9yZUtleX0gc3RvcmVLZXlcbiAqXG4gKiBAcmV0dXJuIHtBZGRIb29rfSBGdW5jdGlvbiB0aGF0IGFkZHMgYSBuZXcgaG9vay5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQWRkSG9vayhob29rcywgc3RvcmVLZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZEhvb2soaG9va05hbWUsIG5hbWVzcGFjZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgcHJpb3JpdHkgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IDEwO1xuICAgIGNvbnN0IGhvb2tzU3RvcmUgPSBob29rc1tzdG9yZUtleV07XG5cbiAgICBpZiAoISgwLCBfdmFsaWRhdGVIb29rTmFtZS5kZWZhdWx0KShob29rTmFtZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISgwLCBfdmFsaWRhdGVOYW1lc3BhY2UuZGVmYXVsdCkobmFtZXNwYWNlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKCdUaGUgaG9vayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBWYWxpZGF0ZSBudW1lcmljIHByaW9yaXR5XG5cblxuICAgIGlmICgnbnVtYmVyJyAhPT0gdHlwZW9mIHByaW9yaXR5KSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcignSWYgc3BlY2lmaWVkLCB0aGUgaG9vayBwcmlvcml0eSBtdXN0IGJlIGEgbnVtYmVyLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZXIgPSB7XG4gICAgICBjYWxsYmFjayxcbiAgICAgIHByaW9yaXR5LFxuICAgICAgbmFtZXNwYWNlXG4gICAgfTtcblxuICAgIGlmIChob29rc1N0b3JlW2hvb2tOYW1lXSkge1xuICAgICAgLy8gRmluZCB0aGUgY29ycmVjdCBpbnNlcnQgaW5kZXggb2YgdGhlIG5ldyBob29rLlxuICAgICAgY29uc3QgaGFuZGxlcnMgPSBob29rc1N0b3JlW2hvb2tOYW1lXS5oYW5kbGVycztcbiAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuXG4gICAgICBsZXQgaTtcblxuICAgICAgZm9yIChpID0gaGFuZGxlcnMubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmIChwcmlvcml0eSA+PSBoYW5kbGVyc1tpIC0gMV0ucHJpb3JpdHkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaSA9PT0gaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgIC8vIElmIGFwcGVuZCwgb3BlcmF0ZSB2aWEgZGlyZWN0IGFzc2lnbm1lbnQuXG4gICAgICAgIGhhbmRsZXJzW2ldID0gaGFuZGxlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgaW5zZXJ0IGJlZm9yZSBpbmRleCB2aWEgc3BsaWNlLlxuICAgICAgICBoYW5kbGVycy5zcGxpY2UoaSwgMCwgaGFuZGxlcik7XG4gICAgICB9IC8vIFdlIG1heSBhbHNvIGJlIGN1cnJlbnRseSBleGVjdXRpbmcgdGhpcyBob29rLiAgSWYgdGhlIGNhbGxiYWNrXG4gICAgICAvLyB3ZSdyZSBhZGRpbmcgd291bGQgY29tZSBhZnRlciB0aGUgY3VycmVudCBjYWxsYmFjaywgdGhlcmUncyBub1xuICAgICAgLy8gcHJvYmxlbTsgb3RoZXJ3aXNlIHdlIG5lZWQgdG8gaW5jcmVhc2UgdGhlIGV4ZWN1dGlvbiBpbmRleCBvZlxuICAgICAgLy8gYW55IG90aGVyIHJ1bnMgYnkgMSB0byBhY2NvdW50IGZvciB0aGUgYWRkZWQgZWxlbWVudC5cblxuXG4gICAgICBob29rc1N0b3JlLl9fY3VycmVudC5mb3JFYWNoKGhvb2tJbmZvID0+IHtcbiAgICAgICAgaWYgKGhvb2tJbmZvLm5hbWUgPT09IGhvb2tOYW1lICYmIGhvb2tJbmZvLmN1cnJlbnRJbmRleCA+PSBpKSB7XG4gICAgICAgICAgaG9va0luZm8uY3VycmVudEluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGlzIGlzIHRoZSBmaXJzdCBob29rIG9mIGl0cyB0eXBlLlxuICAgICAgaG9va3NTdG9yZVtob29rTmFtZV0gPSB7XG4gICAgICAgIGhhbmRsZXJzOiBbaGFuZGxlcl0sXG4gICAgICAgIHJ1bnM6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGhvb2tOYW1lICE9PSAnaG9va0FkZGVkJykge1xuICAgICAgaG9va3MuZG9BY3Rpb24oJ2hvb2tBZGRlZCcsIGhvb2tOYW1lLCBuYW1lc3BhY2UsIGNhbGxiYWNrLCBwcmlvcml0eSk7XG4gICAgfVxuICB9O1xufVxuXG52YXIgX2RlZmF1bHQgPSBjcmVhdGVBZGRIb29rO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcmVhdGVBZGRIb29rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB3aGljaCwgd2hlbiBpbnZva2VkLCB3aWxsIHJldHVybiB0aGUgbmFtZSBvZiB0aGVcbiAqIGN1cnJlbnRseSBydW5uaW5nIGhvb2ssIG9yIGBudWxsYCBpZiBubyBob29rIG9mIHRoZSBnaXZlbiB0eXBlIGlzIGN1cnJlbnRseVxuICogcnVubmluZy5cbiAqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLicpLkhvb2tzfSAgICBob29rcyAgICBIb29rcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuU3RvcmVLZXl9IHN0b3JlS2V5XG4gKlxuICogQHJldHVybiB7KCkgPT4gc3RyaW5nIHwgbnVsbH0gRnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IGhvb2sgbmFtZSBvciBudWxsLlxuICovXG5mdW5jdGlvbiBjcmVhdGVDdXJyZW50SG9vayhob29rcywgc3RvcmVLZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJlbnRIb29rKCkge1xuICAgIHZhciBfaG9va3NTdG9yZSRfX2N1cnJlbnQsIF9ob29rc1N0b3JlJF9fY3VycmVudDI7XG5cbiAgICBjb25zdCBob29rc1N0b3JlID0gaG9va3Nbc3RvcmVLZXldO1xuICAgIHJldHVybiAoX2hvb2tzU3RvcmUkX19jdXJyZW50ID0gKF9ob29rc1N0b3JlJF9fY3VycmVudDIgPSBob29rc1N0b3JlLl9fY3VycmVudFtob29rc1N0b3JlLl9fY3VycmVudC5sZW5ndGggLSAxXSkgPT09IG51bGwgfHwgX2hvb2tzU3RvcmUkX19jdXJyZW50MiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2hvb2tzU3RvcmUkX19jdXJyZW50Mi5uYW1lKSAhPT0gbnVsbCAmJiBfaG9va3NTdG9yZSRfX2N1cnJlbnQgIT09IHZvaWQgMCA/IF9ob29rc1N0b3JlJF9fY3VycmVudCA6IG51bGw7XG4gIH07XG59XG5cbnZhciBfZGVmYXVsdCA9IGNyZWF0ZUN1cnJlbnRIb29rO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcmVhdGVDdXJyZW50SG9vay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHRcIik7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbnZhciBfdmFsaWRhdGVIb29rTmFtZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vdmFsaWRhdGVIb29rTmFtZS5qc1wiKSk7XG5cbi8qKlxuICogSW50ZXJuYWwgZGVwZW5kZW5jaWVzXG4gKi9cblxuLyoqXG4gKiBAY2FsbGJhY2sgRGlkSG9va1xuICpcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiB0aW1lcyBhbiBhY3Rpb24gaGFzIGJlZW4gZmlyZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGhvb2tOYW1lIFRoZSBob29rIG5hbWUgdG8gY2hlY2suXG4gKlxuICogQHJldHVybiB7bnVtYmVyIHwgdW5kZWZpbmVkfSBUaGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBob29rIGhhcyBydW4uXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gaW52b2tlZCwgd2lsbCByZXR1cm4gdGhlIG51bWJlciBvZiB0aW1lcyBhXG4gKiBob29rIGhhcyBiZWVuIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLicpLkhvb2tzfSAgICBob29rcyAgICBIb29rcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuU3RvcmVLZXl9IHN0b3JlS2V5XG4gKlxuICogQHJldHVybiB7RGlkSG9va30gRnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgaG9vaydzIGNhbGwgY291bnQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpZEhvb2soaG9va3MsIHN0b3JlS2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbiBkaWRIb29rKGhvb2tOYW1lKSB7XG4gICAgY29uc3QgaG9va3NTdG9yZSA9IGhvb2tzW3N0b3JlS2V5XTtcblxuICAgIGlmICghKDAsIF92YWxpZGF0ZUhvb2tOYW1lLmRlZmF1bHQpKGhvb2tOYW1lKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBob29rc1N0b3JlW2hvb2tOYW1lXSAmJiBob29rc1N0b3JlW2hvb2tOYW1lXS5ydW5zID8gaG9va3NTdG9yZVtob29rTmFtZV0ucnVucyA6IDA7XG4gIH07XG59XG5cbnZhciBfZGVmYXVsdCA9IGNyZWF0ZURpZEhvb2s7XG5leHBvcnRzLmRlZmF1bHQgPSBfZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNyZWF0ZURpZEhvb2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbi8qKlxuICogQGNhbGxiYWNrIERvaW5nSG9va1xuICogUmV0dXJucyB3aGV0aGVyIGEgaG9vayBpcyBjdXJyZW50bHkgYmVpbmcgZXhlY3V0ZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtob29rTmFtZV0gVGhlIG5hbWUgb2YgdGhlIGhvb2sgdG8gY2hlY2sgZm9yLiAgSWZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9taXR0ZWQsIHdpbGwgY2hlY2sgZm9yIGFueSBob29rIGJlaW5nIGV4ZWN1dGVkLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGhvb2sgaXMgYmVpbmcgZXhlY3V0ZWQuXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gaW52b2tlZCwgd2lsbCByZXR1cm4gd2hldGhlciBhIGhvb2sgaXNcbiAqIGN1cnJlbnRseSBiZWluZyBleGVjdXRlZC5cbiAqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLicpLkhvb2tzfSAgICBob29rcyAgICBIb29rcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuU3RvcmVLZXl9IHN0b3JlS2V5XG4gKlxuICogQHJldHVybiB7RG9pbmdIb29rfSBGdW5jdGlvbiB0aGF0IHJldHVybnMgd2hldGhlciBhIGhvb2sgaXMgY3VycmVudGx5XG4gKiAgICAgICAgICAgICAgICAgICAgIGJlaW5nIGV4ZWN1dGVkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVEb2luZ0hvb2soaG9va3MsIHN0b3JlS2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbiBkb2luZ0hvb2soaG9va05hbWUpIHtcbiAgICBjb25zdCBob29rc1N0b3JlID0gaG9va3Nbc3RvcmVLZXldOyAvLyBJZiB0aGUgaG9va05hbWUgd2FzIG5vdCBwYXNzZWQsIGNoZWNrIGZvciBhbnkgY3VycmVudCBob29rLlxuXG4gICAgaWYgKCd1bmRlZmluZWQnID09PSB0eXBlb2YgaG9va05hbWUpIHtcbiAgICAgIHJldHVybiAndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGhvb2tzU3RvcmUuX19jdXJyZW50WzBdO1xuICAgIH0gLy8gUmV0dXJuIHRoZSBfX2N1cnJlbnQgaG9vay5cblxuXG4gICAgcmV0dXJuIGhvb2tzU3RvcmUuX19jdXJyZW50WzBdID8gaG9va05hbWUgPT09IGhvb2tzU3RvcmUuX19jdXJyZW50WzBdLm5hbWUgOiBmYWxzZTtcbiAgfTtcbn1cblxudmFyIF9kZWZhdWx0ID0gY3JlYXRlRG9pbmdIb29rO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcmVhdGVEb2luZ0hvb2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbi8qKlxuICogQGNhbGxiYWNrIEhhc0hvb2tcbiAqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYW55IGhhbmRsZXJzIGFyZSBhdHRhY2hlZCBmb3IgdGhlIGdpdmVuIGhvb2tOYW1lIGFuZCBvcHRpb25hbCBuYW1lc3BhY2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGhvb2tOYW1lICAgIFRoZSBuYW1lIG9mIHRoZSBob29rIHRvIGNoZWNrIGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZXNwYWNlXSBPcHRpb25hbC4gVGhlIHVuaXF1ZSBuYW1lc3BhY2UgaWRlbnRpZnlpbmcgdGhlIGNhbGxiYWNrXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gdGhlIGZvcm0gYHZlbmRvci9wbHVnaW4vZnVuY3Rpb25gLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlcmUgYXJlIGhhbmRsZXJzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIHRoZSBnaXZlbiBob29rLlxuICovXG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGludm9rZWQsIHdpbGwgcmV0dXJuIHdoZXRoZXIgYW55IGhhbmRsZXJzIGFyZVxuICogYXR0YWNoZWQgdG8gYSBwYXJ0aWN1bGFyIGhvb2suXG4gKlxuICogQHBhcmFtIHtpbXBvcnQoJy4nKS5Ib29rc30gICAgaG9va3MgICAgSG9va3MgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge2ltcG9ydCgnLicpLlN0b3JlS2V5fSBzdG9yZUtleVxuICpcbiAqIEByZXR1cm4ge0hhc0hvb2t9IEZ1bmN0aW9uIHRoYXQgcmV0dXJucyB3aGV0aGVyIGFueSBoYW5kbGVycyBhcmVcbiAqICAgICAgICAgICAgICAgICAgIGF0dGFjaGVkIHRvIGEgcGFydGljdWxhciBob29rIGFuZCBvcHRpb25hbCBuYW1lc3BhY2UuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUhhc0hvb2soaG9va3MsIHN0b3JlS2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbiBoYXNIb29rKGhvb2tOYW1lLCBuYW1lc3BhY2UpIHtcbiAgICBjb25zdCBob29rc1N0b3JlID0gaG9va3Nbc3RvcmVLZXldOyAvLyBVc2UgdGhlIG5hbWVzcGFjZSBpZiBwcm92aWRlZC5cblxuICAgIGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG5hbWVzcGFjZSkge1xuICAgICAgcmV0dXJuIGhvb2tOYW1lIGluIGhvb2tzU3RvcmUgJiYgaG9va3NTdG9yZVtob29rTmFtZV0uaGFuZGxlcnMuc29tZShob29rID0+IGhvb2submFtZXNwYWNlID09PSBuYW1lc3BhY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBob29rTmFtZSBpbiBob29rc1N0b3JlO1xuICB9O1xufVxuXG52YXIgX2RlZmF1bHQgPSBjcmVhdGVIYXNIb29rO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jcmVhdGVIYXNIb29rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2ludGVyb3BSZXF1aXJlRGVmYXVsdFwiKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuX0hvb2tzID0gdm9pZCAwO1xuXG52YXIgX2NyZWF0ZUFkZEhvb2sgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2NyZWF0ZUFkZEhvb2tcIikpO1xuXG52YXIgX2NyZWF0ZVJlbW92ZUhvb2sgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2NyZWF0ZVJlbW92ZUhvb2tcIikpO1xuXG52YXIgX2NyZWF0ZUhhc0hvb2sgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2NyZWF0ZUhhc0hvb2tcIikpO1xuXG52YXIgX2NyZWF0ZVJ1bkhvb2sgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2NyZWF0ZVJ1bkhvb2tcIikpO1xuXG52YXIgX2NyZWF0ZUN1cnJlbnRIb29rID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9jcmVhdGVDdXJyZW50SG9va1wiKSk7XG5cbnZhciBfY3JlYXRlRG9pbmdIb29rID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9jcmVhdGVEb2luZ0hvb2tcIikpO1xuXG52YXIgX2NyZWF0ZURpZEhvb2sgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL2NyZWF0ZURpZEhvb2tcIikpO1xuXG4vKipcbiAqIEludGVybmFsIGRlcGVuZGVuY2llc1xuICovXG5cbi8qKlxuICogSW50ZXJuYWwgY2xhc3MgZm9yIGNvbnN0cnVjdGluZyBob29rcy4gVXNlIGBjcmVhdGVIb29rcygpYCBmdW5jdGlvblxuICpcbiAqIE5vdGUsIGl0IGlzIG5lY2Vzc2FyeSB0byBleHBvc2UgdGhpcyBjbGFzcyB0byBtYWtlIGl0cyB0eXBlIHB1YmxpYy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBfSG9va3Mge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKiogQHR5cGUge2ltcG9ydCgnLicpLlN0b3JlfSBhY3Rpb25zICovXG4gICAgdGhpcy5hY3Rpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmFjdGlvbnMuX19jdXJyZW50ID0gW107XG4gICAgLyoqIEB0eXBlIHtpbXBvcnQoJy4nKS5TdG9yZX0gZmlsdGVycyAqL1xuXG4gICAgdGhpcy5maWx0ZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmZpbHRlcnMuX19jdXJyZW50ID0gW107XG4gICAgdGhpcy5hZGRBY3Rpb24gPSAoMCwgX2NyZWF0ZUFkZEhvb2suZGVmYXVsdCkodGhpcywgJ2FjdGlvbnMnKTtcbiAgICB0aGlzLmFkZEZpbHRlciA9ICgwLCBfY3JlYXRlQWRkSG9vay5kZWZhdWx0KSh0aGlzLCAnZmlsdGVycycpO1xuICAgIHRoaXMucmVtb3ZlQWN0aW9uID0gKDAsIF9jcmVhdGVSZW1vdmVIb29rLmRlZmF1bHQpKHRoaXMsICdhY3Rpb25zJyk7XG4gICAgdGhpcy5yZW1vdmVGaWx0ZXIgPSAoMCwgX2NyZWF0ZVJlbW92ZUhvb2suZGVmYXVsdCkodGhpcywgJ2ZpbHRlcnMnKTtcbiAgICB0aGlzLmhhc0FjdGlvbiA9ICgwLCBfY3JlYXRlSGFzSG9vay5kZWZhdWx0KSh0aGlzLCAnYWN0aW9ucycpO1xuICAgIHRoaXMuaGFzRmlsdGVyID0gKDAsIF9jcmVhdGVIYXNIb29rLmRlZmF1bHQpKHRoaXMsICdmaWx0ZXJzJyk7XG4gICAgdGhpcy5yZW1vdmVBbGxBY3Rpb25zID0gKDAsIF9jcmVhdGVSZW1vdmVIb29rLmRlZmF1bHQpKHRoaXMsICdhY3Rpb25zJywgdHJ1ZSk7XG4gICAgdGhpcy5yZW1vdmVBbGxGaWx0ZXJzID0gKDAsIF9jcmVhdGVSZW1vdmVIb29rLmRlZmF1bHQpKHRoaXMsICdmaWx0ZXJzJywgdHJ1ZSk7XG4gICAgdGhpcy5kb0FjdGlvbiA9ICgwLCBfY3JlYXRlUnVuSG9vay5kZWZhdWx0KSh0aGlzLCAnYWN0aW9ucycpO1xuICAgIHRoaXMuYXBwbHlGaWx0ZXJzID0gKDAsIF9jcmVhdGVSdW5Ib29rLmRlZmF1bHQpKHRoaXMsICdmaWx0ZXJzJywgdHJ1ZSk7XG4gICAgdGhpcy5jdXJyZW50QWN0aW9uID0gKDAsIF9jcmVhdGVDdXJyZW50SG9vay5kZWZhdWx0KSh0aGlzLCAnYWN0aW9ucycpO1xuICAgIHRoaXMuY3VycmVudEZpbHRlciA9ICgwLCBfY3JlYXRlQ3VycmVudEhvb2suZGVmYXVsdCkodGhpcywgJ2ZpbHRlcnMnKTtcbiAgICB0aGlzLmRvaW5nQWN0aW9uID0gKDAsIF9jcmVhdGVEb2luZ0hvb2suZGVmYXVsdCkodGhpcywgJ2FjdGlvbnMnKTtcbiAgICB0aGlzLmRvaW5nRmlsdGVyID0gKDAsIF9jcmVhdGVEb2luZ0hvb2suZGVmYXVsdCkodGhpcywgJ2ZpbHRlcnMnKTtcbiAgICB0aGlzLmRpZEFjdGlvbiA9ICgwLCBfY3JlYXRlRGlkSG9vay5kZWZhdWx0KSh0aGlzLCAnYWN0aW9ucycpO1xuICAgIHRoaXMuZGlkRmlsdGVyID0gKDAsIF9jcmVhdGVEaWRIb29rLmRlZmF1bHQpKHRoaXMsICdmaWx0ZXJzJyk7XG4gIH1cblxufVxuLyoqIEB0eXBlZGVmIHtfSG9va3N9IEhvb2tzICovXG5cbi8qKlxuICogUmV0dXJucyBhbiBpbnN0YW5jZSBvZiB0aGUgaG9va3Mgb2JqZWN0LlxuICpcbiAqIEByZXR1cm4ge0hvb2tzfSBBIEhvb2tzIGluc3RhbmNlLlxuICovXG5cblxuZXhwb3J0cy5fSG9va3MgPSBfSG9va3M7XG5cbmZ1bmN0aW9uIGNyZWF0ZUhvb2tzKCkge1xuICByZXR1cm4gbmV3IF9Ib29rcygpO1xufVxuXG52YXIgX2RlZmF1bHQgPSBjcmVhdGVIb29rcztcbmV4cG9ydHMuZGVmYXVsdCA9IF9kZWZhdWx0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3JlYXRlSG9va3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZShcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvaW50ZXJvcFJlcXVpcmVEZWZhdWx0XCIpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xuXG52YXIgX3ZhbGlkYXRlTmFtZXNwYWNlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi92YWxpZGF0ZU5hbWVzcGFjZS5qc1wiKSk7XG5cbnZhciBfdmFsaWRhdGVIb29rTmFtZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vdmFsaWRhdGVIb29rTmFtZS5qc1wiKSk7XG5cbi8qKlxuICogSW50ZXJuYWwgZGVwZW5kZW5jaWVzXG4gKi9cblxuLyoqXG4gKiBAY2FsbGJhY2sgUmVtb3ZlSG9va1xuICogUmVtb3ZlcyB0aGUgc3BlY2lmaWVkIGNhbGxiYWNrIChvciBhbGwgY2FsbGJhY2tzKSBmcm9tIHRoZSBob29rIHdpdGggYSBnaXZlbiBob29rTmFtZVxuICogYW5kIG5hbWVzcGFjZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaG9va05hbWUgIFRoZSBuYW1lIG9mIHRoZSBob29rIHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgVGhlIHVuaXF1ZSBuYW1lc3BhY2UgaWRlbnRpZnlpbmcgdGhlIGNhbGxiYWNrIGluIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtIGB2ZW5kb3IvcGx1Z2luL2Z1bmN0aW9uYC5cbiAqXG4gKiBAcmV0dXJuIHtudW1iZXIgfCB1bmRlZmluZWR9IFRoZSBudW1iZXIgb2YgY2FsbGJhY2tzIHJlbW92ZWQuXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gaW52b2tlZCwgd2lsbCByZW1vdmUgYSBzcGVjaWZpZWQgaG9vayBvciBhbGxcbiAqIGhvb2tzIGJ5IHRoZSBnaXZlbiBuYW1lLlxuICpcbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuSG9va3N9ICAgIGhvb2tzICAgICAgICAgICAgIEhvb2tzIGluc3RhbmNlLlxuICogQHBhcmFtIHtpbXBvcnQoJy4nKS5TdG9yZUtleX0gc3RvcmVLZXlcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgIFtyZW1vdmVBbGw9ZmFsc2VdIFdoZXRoZXIgdG8gcmVtb3ZlIGFsbCBjYWxsYmFja3MgZm9yIGEgaG9va05hbWUsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRob3V0IHJlZ2FyZCB0byBuYW1lc3BhY2UuIFVzZWQgdG8gY3JlYXRlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgcmVtb3ZlQWxsKmAgZnVuY3Rpb25zLlxuICpcbiAqIEByZXR1cm4ge1JlbW92ZUhvb2t9IEZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyBob29rcy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVtb3ZlSG9vayhob29rcywgc3RvcmVLZXkpIHtcbiAgbGV0IHJlbW92ZUFsbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogZmFsc2U7XG4gIHJldHVybiBmdW5jdGlvbiByZW1vdmVIb29rKGhvb2tOYW1lLCBuYW1lc3BhY2UpIHtcbiAgICBjb25zdCBob29rc1N0b3JlID0gaG9va3Nbc3RvcmVLZXldO1xuXG4gICAgaWYgKCEoMCwgX3ZhbGlkYXRlSG9va05hbWUuZGVmYXVsdCkoaG9va05hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFyZW1vdmVBbGwgJiYgISgwLCBfdmFsaWRhdGVOYW1lc3BhY2UuZGVmYXVsdCkobmFtZXNwYWNlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gQmFpbCBpZiBubyBob29rcyBleGlzdCBieSB0aGlzIG5hbWUuXG5cblxuICAgIGlmICghaG9va3NTdG9yZVtob29rTmFtZV0pIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCBoYW5kbGVyc1JlbW92ZWQgPSAwO1xuXG4gICAgaWYgKHJlbW92ZUFsbCkge1xuICAgICAgaGFuZGxlcnNSZW1vdmVkID0gaG9va3NTdG9yZVtob29rTmFtZV0uaGFuZGxlcnMubGVuZ3RoO1xuICAgICAgaG9va3NTdG9yZVtob29rTmFtZV0gPSB7XG4gICAgICAgIHJ1bnM6IGhvb2tzU3RvcmVbaG9va05hbWVdLnJ1bnMsXG4gICAgICAgIGhhbmRsZXJzOiBbXVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVHJ5IHRvIGZpbmQgdGhlIHNwZWNpZmllZCBjYWxsYmFjayB0byByZW1vdmUuXG4gICAgICBjb25zdCBoYW5kbGVycyA9IGhvb2tzU3RvcmVbaG9va05hbWVdLmhhbmRsZXJzO1xuXG4gICAgICBmb3IgKGxldCBpID0gaGFuZGxlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKGhhbmRsZXJzW2ldLm5hbWVzcGFjZSA9PT0gbmFtZXNwYWNlKSB7XG4gICAgICAgICAgaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIGhhbmRsZXJzUmVtb3ZlZCsrOyAvLyBUaGlzIGNhbGxiYWNrIG1heSBhbHNvIGJlIHBhcnQgb2YgYSBob29rIHRoYXQgaXNcbiAgICAgICAgICAvLyBjdXJyZW50bHkgZXhlY3V0aW5nLiAgSWYgdGhlIGNhbGxiYWNrIHdlJ3JlIHJlbW92aW5nXG4gICAgICAgICAgLy8gY29tZXMgYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbGJhY2ssIHRoZXJlJ3Mgbm8gcHJvYmxlbTtcbiAgICAgICAgICAvLyBvdGhlcndpc2Ugd2UgbmVlZCB0byBkZWNyZWFzZSB0aGUgZXhlY3V0aW9uIGluZGV4IG9mIGFueVxuICAgICAgICAgIC8vIG90aGVyIHJ1bnMgYnkgMSB0byBhY2NvdW50IGZvciB0aGUgcmVtb3ZlZCBlbGVtZW50LlxuXG4gICAgICAgICAgaG9va3NTdG9yZS5fX2N1cnJlbnQuZm9yRWFjaChob29rSW5mbyA9PiB7XG4gICAgICAgICAgICBpZiAoaG9va0luZm8ubmFtZSA9PT0gaG9va05hbWUgJiYgaG9va0luZm8uY3VycmVudEluZGV4ID49IGkpIHtcbiAgICAgICAgICAgICAgaG9va0luZm8uY3VycmVudEluZGV4LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaG9va05hbWUgIT09ICdob29rUmVtb3ZlZCcpIHtcbiAgICAgIGhvb2tzLmRvQWN0aW9uKCdob29rUmVtb3ZlZCcsIGhvb2tOYW1lLCBuYW1lc3BhY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVyc1JlbW92ZWQ7XG4gIH07XG59XG5cbnZhciBfZGVmYXVsdCA9IGNyZWF0ZVJlbW92ZUhvb2s7XG5leHBvcnRzLmRlZmF1bHQgPSBfZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNyZWF0ZVJlbW92ZUhvb2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoLCB3aGVuIGludm9rZWQsIHdpbGwgZXhlY3V0ZSBhbGwgY2FsbGJhY2tzXG4gKiByZWdpc3RlcmVkIHRvIGEgaG9vayBvZiB0aGUgc3BlY2lmaWVkIHR5cGUsIG9wdGlvbmFsbHkgcmV0dXJuaW5nIHRoZSBmaW5hbFxuICogdmFsdWUgb2YgdGhlIGNhbGwgY2hhaW4uXG4gKlxuICogQHBhcmFtIHtpbXBvcnQoJy4nKS5Ib29rc30gICAgaG9va3MgICAgICAgICAgICAgICAgICBIb29rcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7aW1wb3J0KCcuJykuU3RvcmVLZXl9IHN0b3JlS2V5XG4gKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICBbcmV0dXJuRmlyc3RBcmc9ZmFsc2VdIFdoZXRoZXIgZWFjaCBob29rIGNhbGxiYWNrIGlzIGV4cGVjdGVkIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdHMgZmlyc3QgYXJndW1lbnQuXG4gKlxuICogQHJldHVybiB7KGhvb2tOYW1lOnN0cmluZywgLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3dufSBGdW5jdGlvbiB0aGF0IHJ1bnMgaG9vayBjYWxsYmFja3MuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJ1bkhvb2soaG9va3MsIHN0b3JlS2V5KSB7XG4gIGxldCByZXR1cm5GaXJzdEFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogZmFsc2U7XG4gIHJldHVybiBmdW5jdGlvbiBydW5Ib29rcyhob29rTmFtZSkge1xuICAgIGNvbnN0IGhvb2tzU3RvcmUgPSBob29rc1tzdG9yZUtleV07XG5cbiAgICBpZiAoIWhvb2tzU3RvcmVbaG9va05hbWVdKSB7XG4gICAgICBob29rc1N0b3JlW2hvb2tOYW1lXSA9IHtcbiAgICAgICAgaGFuZGxlcnM6IFtdLFxuICAgICAgICBydW5zOiAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIGhvb2tzU3RvcmVbaG9va05hbWVdLnJ1bnMrKztcbiAgICBjb25zdCBoYW5kbGVycyA9IGhvb2tzU3RvcmVbaG9va05hbWVdLmhhbmRsZXJzOyAvLyBUaGUgZm9sbG93aW5nIGNvZGUgaXMgc3RyaXBwZWQgZnJvbSBwcm9kdWN0aW9uIGJ1aWxkcy5cblxuICAgIGlmICgncHJvZHVjdGlvbicgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgICAvLyBIYW5kbGUgYW55ICdhbGwnIGhvb2tzIHJlZ2lzdGVyZWQuXG4gICAgICBpZiAoJ2hvb2tBZGRlZCcgIT09IGhvb2tOYW1lICYmIGhvb2tzU3RvcmUuYWxsKSB7XG4gICAgICAgIGhhbmRsZXJzLnB1c2goLi4uaG9va3NTdG9yZS5hbGwuaGFuZGxlcnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcnMgfHwgIWhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHJldHVybkZpcnN0QXJnID8gYXJnc1swXSA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBob29rSW5mbyA9IHtcbiAgICAgIG5hbWU6IGhvb2tOYW1lLFxuICAgICAgY3VycmVudEluZGV4OiAwXG4gICAgfTtcblxuICAgIGhvb2tzU3RvcmUuX19jdXJyZW50LnB1c2goaG9va0luZm8pO1xuXG4gICAgd2hpbGUgKGhvb2tJbmZvLmN1cnJlbnRJbmRleCA8IGhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJzW2hvb2tJbmZvLmN1cnJlbnRJbmRleF07XG4gICAgICBjb25zdCByZXN1bHQgPSBoYW5kbGVyLmNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3MpO1xuXG4gICAgICBpZiAocmV0dXJuRmlyc3RBcmcpIHtcbiAgICAgICAgYXJnc1swXSA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgaG9va0luZm8uY3VycmVudEluZGV4Kys7XG4gICAgfVxuXG4gICAgaG9va3NTdG9yZS5fX2N1cnJlbnQucG9wKCk7XG5cbiAgICBpZiAocmV0dXJuRmlyc3RBcmcpIHtcbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIF9kZWZhdWx0ID0gY3JlYXRlUnVuSG9vaztcbmV4cG9ydHMuZGVmYXVsdCA9IF9kZWZhdWx0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3JlYXRlUnVuSG9vay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHRcIik7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmFwcGx5RmlsdGVycyA9IGV4cG9ydHMuYWRkRmlsdGVyID0gZXhwb3J0cy5hZGRBY3Rpb24gPSBleHBvcnRzLmFjdGlvbnMgPSB2b2lkIDA7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJjcmVhdGVIb29rc1wiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfY3JlYXRlSG9va3MuZGVmYXVsdDtcbiAgfVxufSk7XG5leHBvcnRzLnJlbW92ZUZpbHRlciA9IGV4cG9ydHMucmVtb3ZlQWxsRmlsdGVycyA9IGV4cG9ydHMucmVtb3ZlQWxsQWN0aW9ucyA9IGV4cG9ydHMucmVtb3ZlQWN0aW9uID0gZXhwb3J0cy5oYXNGaWx0ZXIgPSBleHBvcnRzLmhhc0FjdGlvbiA9IGV4cG9ydHMuZmlsdGVycyA9IGV4cG9ydHMuZG9pbmdGaWx0ZXIgPSBleHBvcnRzLmRvaW5nQWN0aW9uID0gZXhwb3J0cy5kb0FjdGlvbiA9IGV4cG9ydHMuZGlkRmlsdGVyID0gZXhwb3J0cy5kaWRBY3Rpb24gPSBleHBvcnRzLmRlZmF1bHRIb29rcyA9IGV4cG9ydHMuY3VycmVudEZpbHRlciA9IGV4cG9ydHMuY3VycmVudEFjdGlvbiA9IHZvaWQgMDtcblxudmFyIF9jcmVhdGVIb29rcyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vY3JlYXRlSG9va3NcIikpO1xuXG4vKipcbiAqIEludGVybmFsIGRlcGVuZGVuY2llc1xuICovXG5cbi8qKiBAdHlwZWRlZiB7KC4uLmFyZ3M6IGFueVtdKT0+YW55fSBDYWxsYmFjayAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIEhhbmRsZXJcbiAqIEBwcm9wZXJ0eSB7Q2FsbGJhY2t9IGNhbGxiYWNrICBUaGUgY2FsbGJhY2tcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSAgIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlXG4gKiBAcHJvcGVydHkge251bWJlcn0gICBwcmlvcml0eSAgVGhlIG5hbWVzcGFjZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgSG9va1xuICogQHByb3BlcnR5IHtIYW5kbGVyW119IGhhbmRsZXJzIEFycmF5IG9mIGhhbmRsZXJzXG4gKiBAcHJvcGVydHkge251bWJlcn0gICAgcnVucyAgICAgUnVuIGNvdW50ZXJcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIEN1cnJlbnRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lICAgICAgICAgSG9vayBuYW1lXG4gKiBAcHJvcGVydHkge251bWJlcn0gY3VycmVudEluZGV4IFRoZSBpbmRleFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge1JlY29yZDxzdHJpbmcsIEhvb2s+ICYge19fY3VycmVudDogQ3VycmVudFtdfX0gU3RvcmVcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsnYWN0aW9ucycgfCAnZmlsdGVycyd9IFN0b3JlS2V5XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2NyZWF0ZUhvb2tzJykuSG9va3N9IEhvb2tzXG4gKi9cbmNvbnN0IGRlZmF1bHRIb29rcyA9ICgwLCBfY3JlYXRlSG9va3MuZGVmYXVsdCkoKTtcbmV4cG9ydHMuZGVmYXVsdEhvb2tzID0gZGVmYXVsdEhvb2tzO1xuY29uc3Qge1xuICBhZGRBY3Rpb24sXG4gIGFkZEZpbHRlcixcbiAgcmVtb3ZlQWN0aW9uLFxuICByZW1vdmVGaWx0ZXIsXG4gIGhhc0FjdGlvbixcbiAgaGFzRmlsdGVyLFxuICByZW1vdmVBbGxBY3Rpb25zLFxuICByZW1vdmVBbGxGaWx0ZXJzLFxuICBkb0FjdGlvbixcbiAgYXBwbHlGaWx0ZXJzLFxuICBjdXJyZW50QWN0aW9uLFxuICBjdXJyZW50RmlsdGVyLFxuICBkb2luZ0FjdGlvbixcbiAgZG9pbmdGaWx0ZXIsXG4gIGRpZEFjdGlvbixcbiAgZGlkRmlsdGVyLFxuICBhY3Rpb25zLFxuICBmaWx0ZXJzXG59ID0gZGVmYXVsdEhvb2tzO1xuZXhwb3J0cy5maWx0ZXJzID0gZmlsdGVycztcbmV4cG9ydHMuYWN0aW9ucyA9IGFjdGlvbnM7XG5leHBvcnRzLmRpZEZpbHRlciA9IGRpZEZpbHRlcjtcbmV4cG9ydHMuZGlkQWN0aW9uID0gZGlkQWN0aW9uO1xuZXhwb3J0cy5kb2luZ0ZpbHRlciA9IGRvaW5nRmlsdGVyO1xuZXhwb3J0cy5kb2luZ0FjdGlvbiA9IGRvaW5nQWN0aW9uO1xuZXhwb3J0cy5jdXJyZW50RmlsdGVyID0gY3VycmVudEZpbHRlcjtcbmV4cG9ydHMuY3VycmVudEFjdGlvbiA9IGN1cnJlbnRBY3Rpb247XG5leHBvcnRzLmFwcGx5RmlsdGVycyA9IGFwcGx5RmlsdGVycztcbmV4cG9ydHMuZG9BY3Rpb24gPSBkb0FjdGlvbjtcbmV4cG9ydHMucmVtb3ZlQWxsRmlsdGVycyA9IHJlbW92ZUFsbEZpbHRlcnM7XG5leHBvcnRzLnJlbW92ZUFsbEFjdGlvbnMgPSByZW1vdmVBbGxBY3Rpb25zO1xuZXhwb3J0cy5oYXNGaWx0ZXIgPSBoYXNGaWx0ZXI7XG5leHBvcnRzLmhhc0FjdGlvbiA9IGhhc0FjdGlvbjtcbmV4cG9ydHMucmVtb3ZlRmlsdGVyID0gcmVtb3ZlRmlsdGVyO1xuZXhwb3J0cy5yZW1vdmVBY3Rpb24gPSByZW1vdmVBY3Rpb247XG5leHBvcnRzLmFkZEZpbHRlciA9IGFkZEZpbHRlcjtcbmV4cG9ydHMuYWRkQWN0aW9uID0gYWRkQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbi8qKlxuICogVmFsaWRhdGUgYSBob29rTmFtZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGhvb2tOYW1lIFRoZSBob29rIG5hbWUgdG8gdmFsaWRhdGUuIFNob3VsZCBiZSBhIG5vbiBlbXB0eSBzdHJpbmcgY29udGFpbmluZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIG9ubHkgbnVtYmVycywgbGV0dGVycywgZGFzaGVzLCBwZXJpb2RzIGFuZCB1bmRlcnNjb3Jlcy4gQWxzbyxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgaG9vayBuYW1lIGNhbm5vdCBiZWdpbiB3aXRoIGBfX2AuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaG9vayBuYW1lIGlzIHZhbGlkLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUhvb2tOYW1lKGhvb2tOYW1lKSB7XG4gIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGhvb2tOYW1lIHx8ICcnID09PSBob29rTmFtZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcignVGhlIGhvb2sgbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoL15fXy8udGVzdChob29rTmFtZSkpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBob29rIG5hbWUgY2Fubm90IGJlZ2luIHdpdGggYF9fYC4nKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIS9eW2EtekEtWl1bYS16QS1aMC05Xy4tXSokLy50ZXN0KGhvb2tOYW1lKSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcignVGhlIGhvb2sgbmFtZSBjYW4gb25seSBjb250YWluIG51bWJlcnMsIGxldHRlcnMsIGRhc2hlcywgcGVyaW9kcyBhbmQgdW5kZXJzY29yZXMuJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbnZhciBfZGVmYXVsdCA9IHZhbGlkYXRlSG9va05hbWU7XG5leHBvcnRzLmRlZmF1bHQgPSBfZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZhbGlkYXRlSG9va05hbWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbi8qKlxuICogVmFsaWRhdGUgYSBuYW1lc3BhY2Ugc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSB0byB2YWxpZGF0ZSAtIHNob3VsZCB0YWtlIHRoZSBmb3JtXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGB2ZW5kb3IvcGx1Z2luL2Z1bmN0aW9uYC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBuYW1lc3BhY2UgaXMgdmFsaWQuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTmFtZXNwYWNlKG5hbWVzcGFjZSkge1xuICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBuYW1lc3BhY2UgfHwgJycgPT09IG5hbWVzcGFjZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcignVGhlIG5hbWVzcGFjZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIS9eW2EtekEtWl1bYS16QS1aMC05Xy5cXC1cXC9dKiQvLnRlc3QobmFtZXNwYWNlKSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcignVGhlIG5hbWVzcGFjZSBjYW4gb25seSBjb250YWluIG51bWJlcnMsIGxldHRlcnMsIGRhc2hlcywgcGVyaW9kcywgdW5kZXJzY29yZXMgYW5kIHNsYXNoZXMuJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbnZhciBfZGVmYXVsdCA9IHZhbGlkYXRlTmFtZXNwYWNlO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12YWxpZGF0ZU5hbWVzcGFjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHRcIik7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNyZWF0ZUkxOG4gPSB2b2lkIDA7XG5cbnZhciBfdGFubmluID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwidGFubmluXCIpKTtcblxuLyoqXG4gKiBFeHRlcm5hbCBkZXBlbmRlbmNpZXNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtSZWNvcmQ8c3RyaW5nLGFueT59IExvY2FsZURhdGFcbiAqL1xuXG4vKipcbiAqIERlZmF1bHQgbG9jYWxlIGRhdGEgdG8gdXNlIGZvciBUYW5uaW4gZG9tYWluIHdoZW4gbm90IG90aGVyd2lzZSBwcm92aWRlZC5cbiAqIEFzc3VtZXMgYW4gRW5nbGlzaCBwbHVyYWwgZm9ybXMgZXhwcmVzc2lvbi5cbiAqXG4gKiBAdHlwZSB7TG9jYWxlRGF0YX1cbiAqL1xuY29uc3QgREVGQVVMVF9MT0NBTEVfREFUQSA9IHtcbiAgJyc6IHtcbiAgICAvKiogQHBhcmFtIHtudW1iZXJ9IG4gKi9cbiAgICBwbHVyYWxfZm9ybXMobikge1xuICAgICAgcmV0dXJuIG4gPT09IDEgPyAwIDogMTtcbiAgICB9XG5cbiAgfVxufTtcbi8qXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBtYXRjaGVzIGkxOG4gaG9va3MgbGlrZSBgaTE4bi5nZXR0ZXh0YCwgYGkxOG4ubmdldHRleHRgLFxuICogYGkxOG4uZ2V0dGV4dF9kb21haW5gIG9yIGBpMThuLm5nZXR0ZXh0X3dpdGhfY29udGV4dGAgb3IgYGkxOG4uaGFzX3RyYW5zbGF0aW9uYC5cbiAqL1xuXG5jb25zdCBJMThOX0hPT0tfUkVHRVhQID0gL15pMThuXFwuKG4/Z2V0dGV4dHxoYXNfdHJhbnNsYXRpb24pKF98JCkvO1xuLyoqXG4gKiBAdHlwZWRlZiB7KGRvbWFpbj86IHN0cmluZykgPT4gTG9jYWxlRGF0YX0gR2V0TG9jYWxlRGF0YVxuICpcbiAqIFJldHVybnMgbG9jYWxlIGRhdGEgYnkgZG9tYWluIGluIGFcbiAqIEplZC1mb3JtYXR0ZWQgSlNPTiBvYmplY3Qgc2hhcGUuXG4gKlxuICogQHNlZSBodHRwOi8vbWVzc2FnZWZvcm1hdC5naXRodWIuaW8vSmVkL1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYgeyhkYXRhPzogTG9jYWxlRGF0YSwgZG9tYWluPzogc3RyaW5nKSA9PiB2b2lkfSBTZXRMb2NhbGVEYXRhXG4gKlxuICogTWVyZ2VzIGxvY2FsZSBkYXRhIGludG8gdGhlIFRhbm5pbiBpbnN0YW5jZSBieSBkb21haW4uIE5vdGUgdGhhdCB0aGlzXG4gKiBmdW5jdGlvbiB3aWxsIG92ZXJ3cml0ZSB0aGUgZG9tYWluIGNvbmZpZ3VyYXRpb24uIEFjY2VwdHMgZGF0YSBpbiBhXG4gKiBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICpcbiAqIEBzZWUgaHR0cDovL21lc3NhZ2Vmb3JtYXQuZ2l0aHViLmlvL0plZC9cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsoZGF0YT86IExvY2FsZURhdGEsIGRvbWFpbj86IHN0cmluZykgPT4gdm9pZH0gQWRkTG9jYWxlRGF0YVxuICpcbiAqIE1lcmdlcyBsb2NhbGUgZGF0YSBpbnRvIHRoZSBUYW5uaW4gaW5zdGFuY2UgYnkgZG9tYWluLiBOb3RlIHRoYXQgdGhpc1xuICogZnVuY3Rpb24gd2lsbCBhbHNvIG1lcmdlIHRoZSBkb21haW4gY29uZmlndXJhdGlvbi4gQWNjZXB0cyBkYXRhIGluIGFcbiAqIEplZC1mb3JtYXR0ZWQgSlNPTiBvYmplY3Qgc2hhcGUuXG4gKlxuICogQHNlZSBodHRwOi8vbWVzc2FnZWZvcm1hdC5naXRodWIuaW8vSmVkL1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYgeyhkYXRhPzogTG9jYWxlRGF0YSwgZG9tYWluPzogc3RyaW5nKSA9PiB2b2lkfSBSZXNldExvY2FsZURhdGFcbiAqXG4gKiBSZXNldHMgYWxsIGN1cnJlbnQgVGFubmluIGluc3RhbmNlIGxvY2FsZSBkYXRhIGFuZCBzZXRzIHRoZSBzcGVjaWZpZWRcbiAqIGxvY2FsZSBkYXRhIGZvciB0aGUgZG9tYWluLiBBY2NlcHRzIGRhdGEgaW4gYSBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICpcbiAqIEBzZWUgaHR0cDovL21lc3NhZ2Vmb3JtYXQuZ2l0aHViLmlvL0plZC9cbiAqL1xuXG4vKiogQHR5cGVkZWYgeygpID0+IHZvaWR9IFN1YnNjcmliZUNhbGxiYWNrICovXG5cbi8qKiBAdHlwZWRlZiB7KCkgPT4gdm9pZH0gVW5zdWJzY3JpYmVDYWxsYmFjayAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsoY2FsbGJhY2s6IFN1YnNjcmliZUNhbGxiYWNrKSA9PiBVbnN1YnNjcmliZUNhbGxiYWNrfSBTdWJzY3JpYmVcbiAqXG4gKiBTdWJzY3JpYmVzIHRvIGNoYW5nZXMgb2YgbG9jYWxlIGRhdGFcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsoZG9tYWluPzogc3RyaW5nKSA9PiBzdHJpbmd9IEdldEZpbHRlckRvbWFpblxuICogUmV0cmlldmUgdGhlIGRvbWFpbiB0byB1c2Ugd2hlbiBjYWxsaW5nIGRvbWFpbi1zcGVjaWZpYyBmaWx0ZXJzLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgeyh0ZXh0OiBzdHJpbmcsIGRvbWFpbj86IHN0cmluZykgPT4gc3RyaW5nfSBfX1xuICpcbiAqIFJldHJpZXZlIHRoZSB0cmFuc2xhdGlvbiBvZiB0ZXh0LlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIud29yZHByZXNzLm9yZy9yZWZlcmVuY2UvZnVuY3Rpb25zL19fL1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYgeyh0ZXh0OiBzdHJpbmcsIGNvbnRleHQ6IHN0cmluZywgZG9tYWluPzogc3RyaW5nKSA9PiBzdHJpbmd9IF94XG4gKlxuICogUmV0cmlldmUgdHJhbnNsYXRlZCBzdHJpbmcgd2l0aCBnZXR0ZXh0IGNvbnRleHQuXG4gKlxuICogQHNlZSBodHRwczovL2RldmVsb3Blci53b3JkcHJlc3Mub3JnL3JlZmVyZW5jZS9mdW5jdGlvbnMvX3gvXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7KHNpbmdsZTogc3RyaW5nLCBwbHVyYWw6IHN0cmluZywgbnVtYmVyOiBudW1iZXIsIGRvbWFpbj86IHN0cmluZykgPT4gc3RyaW5nfSBfblxuICpcbiAqIFRyYW5zbGF0ZXMgYW5kIHJldHJpZXZlcyB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0gYmFzZWQgb24gdGhlIHN1cHBsaWVkXG4gKiBudW1iZXIuXG4gKlxuICogQHNlZSBodHRwczovL2RldmVsb3Blci53b3JkcHJlc3Mub3JnL3JlZmVyZW5jZS9mdW5jdGlvbnMvX24vXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7KHNpbmdsZTogc3RyaW5nLCBwbHVyYWw6IHN0cmluZywgbnVtYmVyOiBudW1iZXIsIGNvbnRleHQ6IHN0cmluZywgZG9tYWluPzogc3RyaW5nKSA9PiBzdHJpbmd9IF9ueFxuICpcbiAqIFRyYW5zbGF0ZXMgYW5kIHJldHJpZXZlcyB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0gYmFzZWQgb24gdGhlIHN1cHBsaWVkXG4gKiBudW1iZXIsIHdpdGggZ2V0dGV4dCBjb250ZXh0LlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIud29yZHByZXNzLm9yZy9yZWZlcmVuY2UvZnVuY3Rpb25zL19ueC9cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsoKSA9PiBib29sZWFufSBJc1J0bFxuICpcbiAqIENoZWNrIGlmIGN1cnJlbnQgbG9jYWxlIGlzIFJUTC5cbiAqXG4gKiAqKlJUTCAoUmlnaHQgVG8gTGVmdCkqKiBpcyBhIGxvY2FsZSBwcm9wZXJ0eSBpbmRpY2F0aW5nIHRoYXQgdGV4dCBpcyB3cml0dGVuIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEZvciBleGFtcGxlLCB0aGUgYGhlYCBsb2NhbGUgKGZvciBIZWJyZXcpIHNwZWNpZmllcyByaWdodC10by1sZWZ0LiBBcmFiaWMgKGFyKSBpcyBhbm90aGVyIGNvbW1vblxuICogbGFuZ3VhZ2Ugd3JpdHRlbiBSVEwuIFRoZSBvcHBvc2l0ZSBvZiBSVEwsIExUUiAoTGVmdCBUbyBSaWdodCkgaXMgdXNlZCBpbiBvdGhlciBsYW5ndWFnZXMsXG4gKiBpbmNsdWRpbmcgRW5nbGlzaCAoYGVuYCwgYGVuLVVTYCwgYGVuLUdCYCwgZXRjLiksIFNwYW5pc2ggKGBlc2ApLCBhbmQgRnJlbmNoIChgZnJgKS5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHsoc2luZ2xlOiBzdHJpbmcsIGNvbnRleHQ/OiBzdHJpbmcsIGRvbWFpbj86IHN0cmluZykgPT4gYm9vbGVhbn0gSGFzVHJhbnNsYXRpb25cbiAqXG4gKiBDaGVjayBpZiB0aGVyZSBpcyBhIHRyYW5zbGF0aW9uIGZvciBhIGdpdmVuIHN0cmluZyBpbiBzaW5ndWxhciBmb3JtLlxuICovXG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdAd29yZHByZXNzL2hvb2tzJykuSG9va3N9IEhvb2tzICovXG5cbi8qKlxuICogQW4gaTE4biBpbnN0YW5jZVxuICpcbiAqIEB0eXBlZGVmIEkxOG5cbiAqIEBwcm9wZXJ0eSB7R2V0TG9jYWxlRGF0YX0gICBnZXRMb2NhbGVEYXRhICAgUmV0dXJucyBsb2NhbGUgZGF0YSBieSBkb21haW4gaW4gYSBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICogQHByb3BlcnR5IHtTZXRMb2NhbGVEYXRhfSAgIHNldExvY2FsZURhdGEgICBNZXJnZXMgbG9jYWxlIGRhdGEgaW50byB0aGUgVGFubmluIGluc3RhbmNlIGJ5IGRvbWFpbi4gTm90ZSB0aGF0IHRoaXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gd2lsbCBvdmVyd3JpdGUgdGhlIGRvbWFpbiBjb25maWd1cmF0aW9uLiBBY2NlcHRzIGRhdGEgaW4gYVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICogQHByb3BlcnR5IHtBZGRMb2NhbGVEYXRhfSAgIGFkZExvY2FsZURhdGEgICBNZXJnZXMgbG9jYWxlIGRhdGEgaW50byB0aGUgVGFubmluIGluc3RhbmNlIGJ5IGRvbWFpbi4gTm90ZSB0aGF0IHRoaXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gd2lsbCBhbHNvIG1lcmdlIHRoZSBkb21haW4gY29uZmlndXJhdGlvbi4gQWNjZXB0cyBkYXRhIGluIGFcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSmVkLWZvcm1hdHRlZCBKU09OIG9iamVjdCBzaGFwZS5cbiAqIEBwcm9wZXJ0eSB7UmVzZXRMb2NhbGVEYXRhfSByZXNldExvY2FsZURhdGEgUmVzZXRzIGFsbCBjdXJyZW50IFRhbm5pbiBpbnN0YW5jZSBsb2NhbGUgZGF0YSBhbmQgc2V0cyB0aGUgc3BlY2lmaWVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsZSBkYXRhIGZvciB0aGUgZG9tYWluLiBBY2NlcHRzIGRhdGEgaW4gYSBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICogQHByb3BlcnR5IHtTdWJzY3JpYmV9ICAgICAgIHN1YnNjcmliZSAgICAgICBTdWJzY3JpYmVzIHRvIGNoYW5nZXMgb2YgVGFubmluIGxvY2FsZSBkYXRhLlxuICogQHByb3BlcnR5IHtfX30gICAgICAgICAgICAgIF9fICAgICAgICAgICAgICBSZXRyaWV2ZSB0aGUgdHJhbnNsYXRpb24gb2YgdGV4dC5cbiAqIEBwcm9wZXJ0eSB7X3h9ICAgICAgICAgICAgICBfeCAgICAgICAgICAgICAgUmV0cmlldmUgdHJhbnNsYXRlZCBzdHJpbmcgd2l0aCBnZXR0ZXh0IGNvbnRleHQuXG4gKiBAcHJvcGVydHkge19ufSAgICAgICAgICAgICAgX24gICAgICAgICAgICAgIFRyYW5zbGF0ZXMgYW5kIHJldHJpZXZlcyB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0gYmFzZWQgb24gdGhlIHN1cHBsaWVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlci5cbiAqIEBwcm9wZXJ0eSB7X254fSAgICAgICAgICAgICBfbnggICAgICAgICAgICAgVHJhbnNsYXRlcyBhbmQgcmV0cmlldmVzIHRoZSBzaW5ndWxhciBvciBwbHVyYWwgZm9ybSBiYXNlZCBvbiB0aGUgc3VwcGxpZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyLCB3aXRoIGdldHRleHQgY29udGV4dC5cbiAqIEBwcm9wZXJ0eSB7SXNSdGx9ICAgICAgICAgICBpc1JUTCAgICAgICAgICAgQ2hlY2sgaWYgY3VycmVudCBsb2NhbGUgaXMgUlRMLlxuICogQHByb3BlcnR5IHtIYXNUcmFuc2xhdGlvbn0gIGhhc1RyYW5zbGF0aW9uICBDaGVjayBpZiB0aGVyZSBpcyBhIHRyYW5zbGF0aW9uIGZvciBhIGdpdmVuIHN0cmluZy5cbiAqL1xuXG4vKipcbiAqIENyZWF0ZSBhbiBpMThuIGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHtMb2NhbGVEYXRhfSBbaW5pdGlhbERhdGFdICAgTG9jYWxlIGRhdGEgY29uZmlndXJhdGlvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgW2luaXRpYWxEb21haW5dIERvbWFpbiBmb3Igd2hpY2ggY29uZmlndXJhdGlvbiBhcHBsaWVzLlxuICogQHBhcmFtIHtIb29rc30gICAgICBbaG9va3NdICAgICAgICAgSG9va3MgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHJldHVybiB7STE4bn0gSTE4biBpbnN0YW5jZS5cbiAqL1xuXG5jb25zdCBjcmVhdGVJMThuID0gKGluaXRpYWxEYXRhLCBpbml0aWFsRG9tYWluLCBob29rcykgPT4ge1xuICAvKipcbiAgICogVGhlIHVuZGVybHlpbmcgaW5zdGFuY2Ugb2YgVGFubmluIHRvIHdoaWNoIGV4cG9ydGVkIGZ1bmN0aW9ucyBpbnRlcmZhY2UuXG4gICAqXG4gICAqIEB0eXBlIHtUYW5uaW59XG4gICAqL1xuICBjb25zdCB0YW5uaW4gPSBuZXcgX3Rhbm5pbi5kZWZhdWx0KHt9KTtcbiAgY29uc3QgbGlzdGVuZXJzID0gbmV3IFNldCgpO1xuXG4gIGNvbnN0IG5vdGlmeUxpc3RlbmVycyA9ICgpID0+IHtcbiAgICBsaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcbiAgfTtcbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9mIGxvY2FsZSBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0ge1N1YnNjcmliZUNhbGxiYWNrfSBjYWxsYmFjayBTdWJzY3JpcHRpb24gY2FsbGJhY2suXG4gICAqIEByZXR1cm4ge1Vuc3Vic2NyaWJlQ2FsbGJhY2t9IFVuc3Vic2NyaWJlIGNhbGxiYWNrLlxuICAgKi9cblxuXG4gIGNvbnN0IHN1YnNjcmliZSA9IGNhbGxiYWNrID0+IHtcbiAgICBsaXN0ZW5lcnMuYWRkKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4gbGlzdGVuZXJzLmRlbGV0ZShjYWxsYmFjayk7XG4gIH07XG4gIC8qKiBAdHlwZSB7R2V0TG9jYWxlRGF0YX0gKi9cblxuXG4gIGNvbnN0IGdldExvY2FsZURhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRvbWFpbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJ2RlZmF1bHQnO1xuICAgIHJldHVybiB0YW5uaW4uZGF0YVtkb21haW5dO1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtIHtMb2NhbGVEYXRhfSBbZGF0YV1cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICBbZG9tYWluXVxuICAgKi9cblxuXG4gIGNvbnN0IGRvU2V0TG9jYWxlRGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIF90YW5uaW4kZGF0YSRkb21haW47XG5cbiAgICBsZXQgZG9tYWluID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAnZGVmYXVsdCc7XG4gICAgdGFubmluLmRhdGFbZG9tYWluXSA9IHsgLi4udGFubmluLmRhdGFbZG9tYWluXSxcbiAgICAgIC4uLmRhdGFcbiAgICB9OyAvLyBQb3B1bGF0ZSBkZWZhdWx0IGRvbWFpbiBjb25maWd1cmF0aW9uIChzdXBwb3J0ZWQgbG9jYWxlIGRhdGUgd2hpY2ggb21pdHNcbiAgICAvLyBhIHBsdXJhbCBmb3JtcyBleHByZXNzaW9uKS5cblxuICAgIHRhbm5pbi5kYXRhW2RvbWFpbl1bJyddID0geyAuLi5ERUZBVUxUX0xPQ0FMRV9EQVRBWycnXSxcbiAgICAgIC4uLigoX3Rhbm5pbiRkYXRhJGRvbWFpbiA9IHRhbm5pbi5kYXRhW2RvbWFpbl0pID09PSBudWxsIHx8IF90YW5uaW4kZGF0YSRkb21haW4gPT09IHZvaWQgMCA/IHZvaWQgMCA6IF90YW5uaW4kZGF0YSRkb21haW5bJyddKVxuICAgIH07IC8vIENsZWFuIHVwIGNhY2hlZCBwbHVyYWwgZm9ybXMgZnVuY3Rpb25zIGNhY2hlIGFzIGl0IG1pZ2h0IGJlIHVwZGF0ZWQuXG5cbiAgICBkZWxldGUgdGFubmluLnBsdXJhbEZvcm1zW2RvbWFpbl07XG4gIH07XG4gIC8qKiBAdHlwZSB7U2V0TG9jYWxlRGF0YX0gKi9cblxuXG4gIGNvbnN0IHNldExvY2FsZURhdGEgPSAoZGF0YSwgZG9tYWluKSA9PiB7XG4gICAgZG9TZXRMb2NhbGVEYXRhKGRhdGEsIGRvbWFpbik7XG4gICAgbm90aWZ5TGlzdGVuZXJzKCk7XG4gIH07XG4gIC8qKiBAdHlwZSB7QWRkTG9jYWxlRGF0YX0gKi9cblxuXG4gIGNvbnN0IGFkZExvY2FsZURhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBfdGFubmluJGRhdGEkZG9tYWluMjtcblxuICAgIGxldCBkb21haW4gPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICdkZWZhdWx0JztcbiAgICB0YW5uaW4uZGF0YVtkb21haW5dID0geyAuLi50YW5uaW4uZGF0YVtkb21haW5dLFxuICAgICAgLi4uZGF0YSxcbiAgICAgIC8vIFBvcHVsYXRlIGRlZmF1bHQgZG9tYWluIGNvbmZpZ3VyYXRpb24gKHN1cHBvcnRlZCBsb2NhbGUgZGF0ZSB3aGljaCBvbWl0c1xuICAgICAgLy8gYSBwbHVyYWwgZm9ybXMgZXhwcmVzc2lvbikuXG4gICAgICAnJzogeyAuLi5ERUZBVUxUX0xPQ0FMRV9EQVRBWycnXSxcbiAgICAgICAgLi4uKChfdGFubmluJGRhdGEkZG9tYWluMiA9IHRhbm5pbi5kYXRhW2RvbWFpbl0pID09PSBudWxsIHx8IF90YW5uaW4kZGF0YSRkb21haW4yID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfdGFubmluJGRhdGEkZG9tYWluMlsnJ10pLFxuICAgICAgICAuLi4oZGF0YSA9PT0gbnVsbCB8fCBkYXRhID09PSB2b2lkIDAgPyB2b2lkIDAgOiBkYXRhWycnXSlcbiAgICAgIH1cbiAgICB9OyAvLyBDbGVhbiB1cCBjYWNoZWQgcGx1cmFsIGZvcm1zIGZ1bmN0aW9ucyBjYWNoZSBhcyBpdCBtaWdodCBiZSB1cGRhdGVkLlxuXG4gICAgZGVsZXRlIHRhbm5pbi5wbHVyYWxGb3Jtc1tkb21haW5dO1xuICAgIG5vdGlmeUxpc3RlbmVycygpO1xuICB9O1xuICAvKiogQHR5cGUge1Jlc2V0TG9jYWxlRGF0YX0gKi9cblxuXG4gIGNvbnN0IHJlc2V0TG9jYWxlRGF0YSA9IChkYXRhLCBkb21haW4pID0+IHtcbiAgICAvLyBSZXNldCBhbGwgY3VycmVudCBUYW5uaW4gbG9jYWxlIGRhdGEuXG4gICAgdGFubmluLmRhdGEgPSB7fTsgLy8gUmVzZXQgY2FjaGVkIHBsdXJhbCBmb3JtcyBmdW5jdGlvbnMgY2FjaGUuXG5cbiAgICB0YW5uaW4ucGx1cmFsRm9ybXMgPSB7fTtcbiAgICBzZXRMb2NhbGVEYXRhKGRhdGEsIGRvbWFpbik7XG4gIH07XG4gIC8qKlxuICAgKiBXcmFwcGVyIGZvciBUYW5uaW4ncyBgZGNucGdldHRleHRgLiBQb3B1bGF0ZXMgZGVmYXVsdCBsb2NhbGUgZGF0YSBpZiBub3RcbiAgICogb3RoZXJ3aXNlIHByZXZpb3VzbHkgYXNzaWduZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gZG9tYWluICAgRG9tYWluIHRvIHJldHJpZXZlIHRoZSB0cmFuc2xhdGVkIHRleHQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gY29udGV4dCAgQ29udGV4dCBpbmZvcm1hdGlvbiBmb3IgdGhlIHRyYW5zbGF0b3JzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgIHNpbmdsZSAgIFRleHQgdG8gdHJhbnNsYXRlIGlmIG5vbi1wbHVyYWwuIFVzZWQgYXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxsYmFjayByZXR1cm4gdmFsdWUgb24gYSBjYXVnaHQgZXJyb3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgW3BsdXJhbF0gVGhlIHRleHQgdG8gYmUgdXNlZCBpZiB0aGUgbnVtYmVyIGlzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1cmFsLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgIFtudW1iZXJdIFRoZSBudW1iZXIgdG8gY29tcGFyZSBhZ2FpbnN0IHRvIHVzZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVpdGhlciB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0uXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHRyYW5zbGF0ZWQgc3RyaW5nLlxuICAgKi9cblxuXG4gIGNvbnN0IGRjbnBnZXR0ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBkb21haW4gPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICdkZWZhdWx0JztcbiAgICBsZXQgY29udGV4dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIGxldCBzaW5nbGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IGFyZ3VtZW50c1syXSA6IHVuZGVmaW5lZDtcbiAgICBsZXQgcGx1cmFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgPyBhcmd1bWVudHNbM10gOiB1bmRlZmluZWQ7XG4gICAgbGV0IG51bWJlciA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ID8gYXJndW1lbnRzWzRdIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKCF0YW5uaW4uZGF0YVtkb21haW5dKSB7XG4gICAgICAvLyBVc2UgYGRvU2V0TG9jYWxlRGF0YWAgdG8gc2V0IHNpbGVudGx5LCB3aXRob3V0IG5vdGlmeWluZyBsaXN0ZW5lcnMuXG4gICAgICBkb1NldExvY2FsZURhdGEodW5kZWZpbmVkLCBkb21haW4pO1xuICAgIH1cblxuICAgIHJldHVybiB0YW5uaW4uZGNucGdldHRleHQoZG9tYWluLCBjb250ZXh0LCBzaW5nbGUsIHBsdXJhbCwgbnVtYmVyKTtcbiAgfTtcbiAgLyoqIEB0eXBlIHtHZXRGaWx0ZXJEb21haW59ICovXG5cblxuICBjb25zdCBnZXRGaWx0ZXJEb21haW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRvbWFpbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJ2RlZmF1bHQnO1xuICAgIHJldHVybiBkb21haW47XG4gIH07XG4gIC8qKiBAdHlwZSB7X199ICovXG5cblxuICBjb25zdCBfXyA9ICh0ZXh0LCBkb21haW4pID0+IHtcbiAgICBsZXQgdHJhbnNsYXRpb24gPSBkY25wZ2V0dGV4dChkb21haW4sIHVuZGVmaW5lZCwgdGV4dCk7XG5cbiAgICBpZiAoIWhvb2tzKSB7XG4gICAgICByZXR1cm4gdHJhbnNsYXRpb247XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpbHRlcnMgdGV4dCB3aXRoIGl0cyB0cmFuc2xhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0cmFuc2xhdGlvbiBUcmFuc2xhdGVkIHRleHQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgICAgICAgIFRleHQgdG8gdHJhbnNsYXRlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkb21haW4gICAgICBUZXh0IGRvbWFpbi4gVW5pcXVlIGlkZW50aWZpZXIgZm9yIHJldHJpZXZpbmcgdHJhbnNsYXRlZCBzdHJpbmdzLlxuICAgICAqL1xuXG5cbiAgICB0cmFuc2xhdGlvbiA9XG4gICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG5cbiAgICAvKiogQHR5cGUgeyp9ICovXG4gICAgaG9va3MuYXBwbHlGaWx0ZXJzKCdpMThuLmdldHRleHQnLCB0cmFuc2xhdGlvbiwgdGV4dCwgZG9tYWluKTtcbiAgICByZXR1cm4gKFxuICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG5cbiAgICAgIC8qKiBAdHlwZSB7Kn0gKi9cbiAgICAgIGhvb2tzLmFwcGx5RmlsdGVycygnaTE4bi5nZXR0ZXh0XycgKyBnZXRGaWx0ZXJEb21haW4oZG9tYWluKSwgdHJhbnNsYXRpb24sIHRleHQsIGRvbWFpbilcbiAgICApO1xuICB9O1xuICAvKiogQHR5cGUge194fSAqL1xuXG5cbiAgY29uc3QgX3ggPSAodGV4dCwgY29udGV4dCwgZG9tYWluKSA9PiB7XG4gICAgbGV0IHRyYW5zbGF0aW9uID0gZGNucGdldHRleHQoZG9tYWluLCBjb250ZXh0LCB0ZXh0KTtcblxuICAgIGlmICghaG9va3MpIHtcbiAgICAgIHJldHVybiB0cmFuc2xhdGlvbjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmlsdGVycyB0ZXh0IHdpdGggaXRzIHRyYW5zbGF0aW9uIGJhc2VkIG9uIGNvbnRleHQgaW5mb3JtYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHJhbnNsYXRpb24gVHJhbnNsYXRlZCB0ZXh0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0ICAgICAgICBUZXh0IHRvIHRyYW5zbGF0ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGV4dCAgICAgQ29udGV4dCBpbmZvcm1hdGlvbiBmb3IgdGhlIHRyYW5zbGF0b3JzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkb21haW4gICAgICBUZXh0IGRvbWFpbi4gVW5pcXVlIGlkZW50aWZpZXIgZm9yIHJldHJpZXZpbmcgdHJhbnNsYXRlZCBzdHJpbmdzLlxuICAgICAqL1xuXG5cbiAgICB0cmFuc2xhdGlvbiA9XG4gICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG5cbiAgICAvKiogQHR5cGUgeyp9ICovXG4gICAgaG9va3MuYXBwbHlGaWx0ZXJzKCdpMThuLmdldHRleHRfd2l0aF9jb250ZXh0JywgdHJhbnNsYXRpb24sIHRleHQsIGNvbnRleHQsIGRvbWFpbik7XG4gICAgcmV0dXJuIChcbiAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuXG4gICAgICAvKiogQHR5cGUgeyp9ICovXG4gICAgICBob29rcy5hcHBseUZpbHRlcnMoJ2kxOG4uZ2V0dGV4dF93aXRoX2NvbnRleHRfJyArIGdldEZpbHRlckRvbWFpbihkb21haW4pLCB0cmFuc2xhdGlvbiwgdGV4dCwgY29udGV4dCwgZG9tYWluKVxuICAgICk7XG4gIH07XG4gIC8qKiBAdHlwZSB7X259ICovXG5cblxuICBjb25zdCBfbiA9IChzaW5nbGUsIHBsdXJhbCwgbnVtYmVyLCBkb21haW4pID0+IHtcbiAgICBsZXQgdHJhbnNsYXRpb24gPSBkY25wZ2V0dGV4dChkb21haW4sIHVuZGVmaW5lZCwgc2luZ2xlLCBwbHVyYWwsIG51bWJlcik7XG5cbiAgICBpZiAoIWhvb2tzKSB7XG4gICAgICByZXR1cm4gdHJhbnNsYXRpb247XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpbHRlcnMgdGhlIHNpbmd1bGFyIG9yIHBsdXJhbCBmb3JtIG9mIGEgc3RyaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRyYW5zbGF0aW9uIFRyYW5zbGF0ZWQgdGV4dC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2luZ2xlICAgICAgVGhlIHRleHQgdG8gYmUgdXNlZCBpZiB0aGUgbnVtYmVyIGlzIHNpbmd1bGFyLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwbHVyYWwgICAgICBUaGUgdGV4dCB0byBiZSB1c2VkIGlmIHRoZSBudW1iZXIgaXMgcGx1cmFsLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBudW1iZXIgICAgICBUaGUgbnVtYmVyIHRvIGNvbXBhcmUgYWdhaW5zdCB0byB1c2UgZWl0aGVyIHRoZSBzaW5ndWxhciBvciBwbHVyYWwgZm9ybS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZG9tYWluICAgICAgVGV4dCBkb21haW4uIFVuaXF1ZSBpZGVudGlmaWVyIGZvciByZXRyaWV2aW5nIHRyYW5zbGF0ZWQgc3RyaW5ncy5cbiAgICAgKi9cblxuXG4gICAgdHJhbnNsYXRpb24gPVxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuXG4gICAgLyoqIEB0eXBlIHsqfSAqL1xuICAgIGhvb2tzLmFwcGx5RmlsdGVycygnaTE4bi5uZ2V0dGV4dCcsIHRyYW5zbGF0aW9uLCBzaW5nbGUsIHBsdXJhbCwgbnVtYmVyLCBkb21haW4pO1xuICAgIHJldHVybiAoXG4gICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cblxuICAgICAgLyoqIEB0eXBlIHsqfSAqL1xuICAgICAgaG9va3MuYXBwbHlGaWx0ZXJzKCdpMThuLm5nZXR0ZXh0XycgKyBnZXRGaWx0ZXJEb21haW4oZG9tYWluKSwgdHJhbnNsYXRpb24sIHNpbmdsZSwgcGx1cmFsLCBudW1iZXIsIGRvbWFpbilcbiAgICApO1xuICB9O1xuICAvKiogQHR5cGUge19ueH0gKi9cblxuXG4gIGNvbnN0IF9ueCA9IChzaW5nbGUsIHBsdXJhbCwgbnVtYmVyLCBjb250ZXh0LCBkb21haW4pID0+IHtcbiAgICBsZXQgdHJhbnNsYXRpb24gPSBkY25wZ2V0dGV4dChkb21haW4sIGNvbnRleHQsIHNpbmdsZSwgcGx1cmFsLCBudW1iZXIpO1xuXG4gICAgaWYgKCFob29rcykge1xuICAgICAgcmV0dXJuIHRyYW5zbGF0aW9uO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaWx0ZXJzIHRoZSBzaW5ndWxhciBvciBwbHVyYWwgZm9ybSBvZiBhIHN0cmluZyB3aXRoIGdldHRleHQgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0cmFuc2xhdGlvbiBUcmFuc2xhdGVkIHRleHQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNpbmdsZSAgICAgIFRoZSB0ZXh0IHRvIGJlIHVzZWQgaWYgdGhlIG51bWJlciBpcyBzaW5ndWxhci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGx1cmFsICAgICAgVGhlIHRleHQgdG8gYmUgdXNlZCBpZiB0aGUgbnVtYmVyIGlzIHBsdXJhbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbnVtYmVyICAgICAgVGhlIG51bWJlciB0byBjb21wYXJlIGFnYWluc3QgdG8gdXNlIGVpdGhlciB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRleHQgICAgIENvbnRleHQgaW5mb3JtYXRpb24gZm9yIHRoZSB0cmFuc2xhdG9ycy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZG9tYWluICAgICAgVGV4dCBkb21haW4uIFVuaXF1ZSBpZGVudGlmaWVyIGZvciByZXRyaWV2aW5nIHRyYW5zbGF0ZWQgc3RyaW5ncy5cbiAgICAgKi9cblxuXG4gICAgdHJhbnNsYXRpb24gPVxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuXG4gICAgLyoqIEB0eXBlIHsqfSAqL1xuICAgIGhvb2tzLmFwcGx5RmlsdGVycygnaTE4bi5uZ2V0dGV4dF93aXRoX2NvbnRleHQnLCB0cmFuc2xhdGlvbiwgc2luZ2xlLCBwbHVyYWwsIG51bWJlciwgY29udGV4dCwgZG9tYWluKTtcbiAgICByZXR1cm4gKFxuICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG5cbiAgICAgIC8qKiBAdHlwZSB7Kn0gKi9cbiAgICAgIGhvb2tzLmFwcGx5RmlsdGVycygnaTE4bi5uZ2V0dGV4dF93aXRoX2NvbnRleHRfJyArIGdldEZpbHRlckRvbWFpbihkb21haW4pLCB0cmFuc2xhdGlvbiwgc2luZ2xlLCBwbHVyYWwsIG51bWJlciwgY29udGV4dCwgZG9tYWluKVxuICAgICk7XG4gIH07XG4gIC8qKiBAdHlwZSB7SXNSdGx9ICovXG5cblxuICBjb25zdCBpc1JUTCA9ICgpID0+IHtcbiAgICByZXR1cm4gJ3J0bCcgPT09IF94KCdsdHInLCAndGV4dCBkaXJlY3Rpb24nKTtcbiAgfTtcbiAgLyoqIEB0eXBlIHtIYXNUcmFuc2xhdGlvbn0gKi9cblxuXG4gIGNvbnN0IGhhc1RyYW5zbGF0aW9uID0gKHNpbmdsZSwgY29udGV4dCwgZG9tYWluKSA9PiB7XG4gICAgdmFyIF90YW5uaW4kZGF0YSwgX3Rhbm5pbiRkYXRhMjtcblxuICAgIGNvbnN0IGtleSA9IGNvbnRleHQgPyBjb250ZXh0ICsgJ1xcdTAwMDQnICsgc2luZ2xlIDogc2luZ2xlO1xuICAgIGxldCByZXN1bHQgPSAhISgoX3Rhbm5pbiRkYXRhID0gdGFubmluLmRhdGEpICE9PSBudWxsICYmIF90YW5uaW4kZGF0YSAhPT0gdm9pZCAwICYmIChfdGFubmluJGRhdGEyID0gX3Rhbm5pbiRkYXRhW2RvbWFpbiAhPT0gbnVsbCAmJiBkb21haW4gIT09IHZvaWQgMCA/IGRvbWFpbiA6ICdkZWZhdWx0J10pICE9PSBudWxsICYmIF90YW5uaW4kZGF0YTIgIT09IHZvaWQgMCAmJiBfdGFubmluJGRhdGEyW2tleV0pO1xuXG4gICAgaWYgKGhvb2tzKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpbHRlcnMgdGhlIHByZXNlbmNlIG9mIGEgdHJhbnNsYXRpb24gaW4gdGhlIGxvY2FsZSBkYXRhLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFzVHJhbnNsYXRpb24gV2hldGhlciB0aGUgdHJhbnNsYXRpb24gaXMgcHJlc2VudCBvciBub3QuLlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9ICBzaW5nbGUgICAgICAgICBUaGUgc2luZ3VsYXIgZm9ybSBvZiB0aGUgdHJhbnNsYXRlZCB0ZXh0ICh1c2VkIGFzIGtleSBpbiBsb2NhbGUgZGF0YSlcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSAgY29udGV4dCAgICAgICAgQ29udGV4dCBpbmZvcm1hdGlvbiBmb3IgdGhlIHRyYW5zbGF0b3JzLlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9ICBkb21haW4gICAgICAgICBUZXh0IGRvbWFpbi4gVW5pcXVlIGlkZW50aWZpZXIgZm9yIHJldHJpZXZpbmcgdHJhbnNsYXRlZCBzdHJpbmdzLlxuICAgICAgICovXG4gICAgICByZXN1bHQgPVxuICAgICAgLyoqIEB0eXBlIHsgYm9vbGVhbiB9ICovXG5cbiAgICAgIC8qKiBAdHlwZSB7Kn0gKi9cbiAgICAgIGhvb2tzLmFwcGx5RmlsdGVycygnaTE4bi5oYXNfdHJhbnNsYXRpb24nLCByZXN1bHQsIHNpbmdsZSwgY29udGV4dCwgZG9tYWluKTtcbiAgICAgIHJlc3VsdCA9XG4gICAgICAvKiogQHR5cGUgeyBib29sZWFuIH0gKi9cblxuICAgICAgLyoqIEB0eXBlIHsqfSAqL1xuICAgICAgaG9va3MuYXBwbHlGaWx0ZXJzKCdpMThuLmhhc190cmFuc2xhdGlvbl8nICsgZ2V0RmlsdGVyRG9tYWluKGRvbWFpbiksIHJlc3VsdCwgc2luZ2xlLCBjb250ZXh0LCBkb21haW4pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgaWYgKGluaXRpYWxEYXRhKSB7XG4gICAgc2V0TG9jYWxlRGF0YShpbml0aWFsRGF0YSwgaW5pdGlhbERvbWFpbik7XG4gIH1cblxuICBpZiAoaG9va3MpIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaG9va05hbWVcbiAgICAgKi9cbiAgICBjb25zdCBvbkhvb2tBZGRlZE9yUmVtb3ZlZCA9IGhvb2tOYW1lID0+IHtcbiAgICAgIGlmIChJMThOX0hPT0tfUkVHRVhQLnRlc3QoaG9va05hbWUpKSB7XG4gICAgICAgIG5vdGlmeUxpc3RlbmVycygpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBob29rcy5hZGRBY3Rpb24oJ2hvb2tBZGRlZCcsICdjb3JlL2kxOG4nLCBvbkhvb2tBZGRlZE9yUmVtb3ZlZCk7XG4gICAgaG9va3MuYWRkQWN0aW9uKCdob29rUmVtb3ZlZCcsICdjb3JlL2kxOG4nLCBvbkhvb2tBZGRlZE9yUmVtb3ZlZCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldExvY2FsZURhdGEsXG4gICAgc2V0TG9jYWxlRGF0YSxcbiAgICBhZGRMb2NhbGVEYXRhLFxuICAgIHJlc2V0TG9jYWxlRGF0YSxcbiAgICBzdWJzY3JpYmUsXG4gICAgX18sXG4gICAgX3gsXG4gICAgX24sXG4gICAgX254LFxuICAgIGlzUlRMLFxuICAgIGhhc1RyYW5zbGF0aW9uXG4gIH07XG59O1xuXG5leHBvcnRzLmNyZWF0ZUkxOG4gPSBjcmVhdGVJMThuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3JlYXRlLWkxOG4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnN1YnNjcmliZSA9IGV4cG9ydHMuc2V0TG9jYWxlRGF0YSA9IGV4cG9ydHMucmVzZXRMb2NhbGVEYXRhID0gZXhwb3J0cy5pc1JUTCA9IGV4cG9ydHMuaGFzVHJhbnNsYXRpb24gPSBleHBvcnRzLmdldExvY2FsZURhdGEgPSBleHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLl94ID0gZXhwb3J0cy5fbnggPSBleHBvcnRzLl9uID0gZXhwb3J0cy5fXyA9IHZvaWQgMDtcblxudmFyIF9jcmVhdGVJMThuID0gcmVxdWlyZShcIi4vY3JlYXRlLWkxOG5cIik7XG5cbnZhciBfaG9va3MgPSByZXF1aXJlKFwiQHdvcmRwcmVzcy9ob29rc1wiKTtcblxuLyoqXG4gKiBJbnRlcm5hbCBkZXBlbmRlbmNpZXNcbiAqL1xuXG4vKipcbiAqIFdvcmRQcmVzcyBkZXBlbmRlbmNpZXNcbiAqL1xuY29uc3QgaTE4biA9ICgwLCBfY3JlYXRlSTE4bi5jcmVhdGVJMThuKSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgX2hvb2tzLmRlZmF1bHRIb29rcyk7XG4vKipcbiAqIERlZmF1bHQsIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBgSTE4bmAuXG4gKi9cblxudmFyIF9kZWZhdWx0ID0gaTE4bjtcbi8qXG4gKiBDb21tZW50cyBpbiB0aGlzIGZpbGUgYXJlIGR1cGxpY2F0ZWQgZnJvbSAuL2kxOG4gZHVlIHRvXG4gKiBodHRwczovL2dpdGh1Yi5jb20vV29yZFByZXNzL2d1dGVuYmVyZy9wdWxsLzIwMzE4I2lzc3VlY29tbWVudC01OTA4Mzc3MjJcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vY3JlYXRlLWkxOG4nKS5Mb2NhbGVEYXRhfSBMb2NhbGVEYXRhXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2NyZWF0ZS1pMThuJykuU3Vic2NyaWJlQ2FsbGJhY2t9IFN1YnNjcmliZUNhbGxiYWNrXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2NyZWF0ZS1pMThuJykuVW5zdWJzY3JpYmVDYWxsYmFja30gVW5zdWJzY3JpYmVDYWxsYmFja1xuICovXG5cbi8qKlxuICogUmV0dXJucyBsb2NhbGUgZGF0YSBieSBkb21haW4gaW4gYSBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICpcbiAqIEBzZWUgaHR0cDovL21lc3NhZ2Vmb3JtYXQuZ2l0aHViLmlvL0plZC9cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RvbWFpbl0gRG9tYWluIGZvciB3aGljaCB0byBnZXQgdGhlIGRhdGEuXG4gKiBAcmV0dXJuIHtMb2NhbGVEYXRhfSBMb2NhbGUgZGF0YS5cbiAqL1xuXG5leHBvcnRzLmRlZmF1bHQgPSBfZGVmYXVsdDtcbmNvbnN0IGdldExvY2FsZURhdGEgPSBpMThuLmdldExvY2FsZURhdGEuYmluZChpMThuKTtcbi8qKlxuICogTWVyZ2VzIGxvY2FsZSBkYXRhIGludG8gdGhlIFRhbm5pbiBpbnN0YW5jZSBieSBkb21haW4uIEFjY2VwdHMgZGF0YSBpbiBhXG4gKiBKZWQtZm9ybWF0dGVkIEpTT04gb2JqZWN0IHNoYXBlLlxuICpcbiAqIEBzZWUgaHR0cDovL21lc3NhZ2Vmb3JtYXQuZ2l0aHViLmlvL0plZC9cbiAqXG4gKiBAcGFyYW0ge0xvY2FsZURhdGF9IFtkYXRhXSAgIExvY2FsZSBkYXRhIGNvbmZpZ3VyYXRpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgIFtkb21haW5dIERvbWFpbiBmb3Igd2hpY2ggY29uZmlndXJhdGlvbiBhcHBsaWVzLlxuICovXG5cbmV4cG9ydHMuZ2V0TG9jYWxlRGF0YSA9IGdldExvY2FsZURhdGE7XG5jb25zdCBzZXRMb2NhbGVEYXRhID0gaTE4bi5zZXRMb2NhbGVEYXRhLmJpbmQoaTE4bik7XG4vKipcbiAqIFJlc2V0cyBhbGwgY3VycmVudCBUYW5uaW4gaW5zdGFuY2UgbG9jYWxlIGRhdGEgYW5kIHNldHMgdGhlIHNwZWNpZmllZFxuICogbG9jYWxlIGRhdGEgZm9yIHRoZSBkb21haW4uIEFjY2VwdHMgZGF0YSBpbiBhIEplZC1mb3JtYXR0ZWQgSlNPTiBvYmplY3Qgc2hhcGUuXG4gKlxuICogQHNlZSBodHRwOi8vbWVzc2FnZWZvcm1hdC5naXRodWIuaW8vSmVkL1xuICpcbiAqIEBwYXJhbSB7TG9jYWxlRGF0YX0gW2RhdGFdICAgTG9jYWxlIGRhdGEgY29uZmlndXJhdGlvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgW2RvbWFpbl0gRG9tYWluIGZvciB3aGljaCBjb25maWd1cmF0aW9uIGFwcGxpZXMuXG4gKi9cblxuZXhwb3J0cy5zZXRMb2NhbGVEYXRhID0gc2V0TG9jYWxlRGF0YTtcbmNvbnN0IHJlc2V0TG9jYWxlRGF0YSA9IGkxOG4ucmVzZXRMb2NhbGVEYXRhLmJpbmQoaTE4bik7XG4vKipcbiAqIFN1YnNjcmliZXMgdG8gY2hhbmdlcyBvZiBsb2NhbGUgZGF0YVxuICpcbiAqIEBwYXJhbSB7U3Vic2NyaWJlQ2FsbGJhY2t9IGNhbGxiYWNrIFN1YnNjcmlwdGlvbiBjYWxsYmFja1xuICogQHJldHVybiB7VW5zdWJzY3JpYmVDYWxsYmFja30gVW5zdWJzY3JpYmUgY2FsbGJhY2tcbiAqL1xuXG5leHBvcnRzLnJlc2V0TG9jYWxlRGF0YSA9IHJlc2V0TG9jYWxlRGF0YTtcbmNvbnN0IHN1YnNjcmliZSA9IGkxOG4uc3Vic2NyaWJlLmJpbmQoaTE4bik7XG4vKipcbiAqIFJldHJpZXZlIHRoZSB0cmFuc2xhdGlvbiBvZiB0ZXh0LlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIud29yZHByZXNzLm9yZy9yZWZlcmVuY2UvZnVuY3Rpb25zL19fL1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0ICAgICBUZXh0IHRvIHRyYW5zbGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbZG9tYWluXSBEb21haW4gdG8gcmV0cmlldmUgdGhlIHRyYW5zbGF0ZWQgdGV4dC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRyYW5zbGF0ZWQgdGV4dC5cbiAqL1xuXG5leHBvcnRzLnN1YnNjcmliZSA9IHN1YnNjcmliZTtcblxuY29uc3QgX18gPSBpMThuLl9fLmJpbmQoaTE4bik7XG4vKipcbiAqIFJldHJpZXZlIHRyYW5zbGF0ZWQgc3RyaW5nIHdpdGggZ2V0dGV4dCBjb250ZXh0LlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIud29yZHByZXNzLm9yZy9yZWZlcmVuY2UvZnVuY3Rpb25zL194L1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0ICAgICBUZXh0IHRvIHRyYW5zbGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb250ZXh0ICBDb250ZXh0IGluZm9ybWF0aW9uIGZvciB0aGUgdHJhbnNsYXRvcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RvbWFpbl0gRG9tYWluIHRvIHJldHJpZXZlIHRoZSB0cmFuc2xhdGVkIHRleHQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUcmFuc2xhdGVkIGNvbnRleHQgc3RyaW5nIHdpdGhvdXQgcGlwZS5cbiAqL1xuXG5cbmV4cG9ydHMuX18gPSBfXztcblxuY29uc3QgX3ggPSBpMThuLl94LmJpbmQoaTE4bik7XG4vKipcbiAqIFRyYW5zbGF0ZXMgYW5kIHJldHJpZXZlcyB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0gYmFzZWQgb24gdGhlIHN1cHBsaWVkXG4gKiBudW1iZXIuXG4gKlxuICogQHNlZSBodHRwczovL2RldmVsb3Blci53b3JkcHJlc3Mub3JnL3JlZmVyZW5jZS9mdW5jdGlvbnMvX24vXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHNpbmdsZSAgIFRoZSB0ZXh0IHRvIGJlIHVzZWQgaWYgdGhlIG51bWJlciBpcyBzaW5ndWxhci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwbHVyYWwgICBUaGUgdGV4dCB0byBiZSB1c2VkIGlmIHRoZSBudW1iZXIgaXMgcGx1cmFsLlxuICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciAgIFRoZSBudW1iZXIgdG8gY29tcGFyZSBhZ2FpbnN0IHRvIHVzZSBlaXRoZXIgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0uXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RvbWFpbl0gRG9tYWluIHRvIHJldHJpZXZlIHRoZSB0cmFuc2xhdGVkIHRleHQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHJhbnNsYXRlZCBzaW5ndWxhciBvciBwbHVyYWwgZm9ybS5cbiAqL1xuXG5cbmV4cG9ydHMuX3ggPSBfeDtcblxuY29uc3QgX24gPSBpMThuLl9uLmJpbmQoaTE4bik7XG4vKipcbiAqIFRyYW5zbGF0ZXMgYW5kIHJldHJpZXZlcyB0aGUgc2luZ3VsYXIgb3IgcGx1cmFsIGZvcm0gYmFzZWQgb24gdGhlIHN1cHBsaWVkXG4gKiBudW1iZXIsIHdpdGggZ2V0dGV4dCBjb250ZXh0LlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIud29yZHByZXNzLm9yZy9yZWZlcmVuY2UvZnVuY3Rpb25zL19ueC9cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2luZ2xlICAgVGhlIHRleHQgdG8gYmUgdXNlZCBpZiB0aGUgbnVtYmVyIGlzIHNpbmd1bGFyLlxuICogQHBhcmFtIHtzdHJpbmd9IHBsdXJhbCAgIFRoZSB0ZXh0IHRvIGJlIHVzZWQgaWYgdGhlIG51bWJlciBpcyBwbHVyYWwuXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyICAgVGhlIG51bWJlciB0byBjb21wYXJlIGFnYWluc3QgdG8gdXNlIGVpdGhlciB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5ndWxhciBvciBwbHVyYWwgZm9ybS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb250ZXh0ICBDb250ZXh0IGluZm9ybWF0aW9uIGZvciB0aGUgdHJhbnNsYXRvcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RvbWFpbl0gRG9tYWluIHRvIHJldHJpZXZlIHRoZSB0cmFuc2xhdGVkIHRleHQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHJhbnNsYXRlZCBzaW5ndWxhciBvciBwbHVyYWwgZm9ybS5cbiAqL1xuXG5cbmV4cG9ydHMuX24gPSBfbjtcblxuY29uc3QgX254ID0gaTE4bi5fbnguYmluZChpMThuKTtcbi8qKlxuICogQ2hlY2sgaWYgY3VycmVudCBsb2NhbGUgaXMgUlRMLlxuICpcbiAqICoqUlRMIChSaWdodCBUbyBMZWZ0KSoqIGlzIGEgbG9jYWxlIHByb3BlcnR5IGluZGljYXRpbmcgdGhhdCB0ZXh0IGlzIHdyaXR0ZW4gZnJvbSByaWdodCB0byBsZWZ0LlxuICogRm9yIGV4YW1wbGUsIHRoZSBgaGVgIGxvY2FsZSAoZm9yIEhlYnJldykgc3BlY2lmaWVzIHJpZ2h0LXRvLWxlZnQuIEFyYWJpYyAoYXIpIGlzIGFub3RoZXIgY29tbW9uXG4gKiBsYW5ndWFnZSB3cml0dGVuIFJUTC4gVGhlIG9wcG9zaXRlIG9mIFJUTCwgTFRSIChMZWZ0IFRvIFJpZ2h0KSBpcyB1c2VkIGluIG90aGVyIGxhbmd1YWdlcyxcbiAqIGluY2x1ZGluZyBFbmdsaXNoIChgZW5gLCBgZW4tVVNgLCBgZW4tR0JgLCBldGMuKSwgU3BhbmlzaCAoYGVzYCksIGFuZCBGcmVuY2ggKGBmcmApLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbG9jYWxlIGlzIFJUTC5cbiAqL1xuXG5cbmV4cG9ydHMuX254ID0gX254O1xuY29uc3QgaXNSVEwgPSBpMThuLmlzUlRMLmJpbmQoaTE4bik7XG4vKipcbiAqIENoZWNrIGlmIHRoZXJlIGlzIGEgdHJhbnNsYXRpb24gZm9yIGEgZ2l2ZW4gc3RyaW5nIChpbiBzaW5ndWxhciBmb3JtKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2luZ2xlICAgIFNpbmd1bGFyIGZvcm0gb2YgdGhlIHN0cmluZyB0byBsb29rIHVwLlxuICogQHBhcmFtIHtzdHJpbmd9IFtjb250ZXh0XSBDb250ZXh0IGluZm9ybWF0aW9uIGZvciB0aGUgdHJhbnNsYXRvcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RvbWFpbl0gIERvbWFpbiB0byByZXRyaWV2ZSB0aGUgdHJhbnNsYXRlZCB0ZXh0LlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdHJhbnNsYXRpb24gZXhpc3RzIG9yIG5vdC5cbiAqL1xuXG5leHBvcnRzLmlzUlRMID0gaXNSVEw7XG5jb25zdCBoYXNUcmFuc2xhdGlvbiA9IGkxOG4uaGFzVHJhbnNsYXRpb24uYmluZChpMThuKTtcbmV4cG9ydHMuaGFzVHJhbnNsYXRpb24gPSBoYXNUcmFuc2xhdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlZmF1bHQtaTE4bi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbnZhciBfZXhwb3J0TmFtZXMgPSB7XG4gIHNwcmludGY6IHRydWUsXG4gIGRlZmF1bHRJMThuOiB0cnVlLFxuICBzZXRMb2NhbGVEYXRhOiB0cnVlLFxuICByZXNldExvY2FsZURhdGE6IHRydWUsXG4gIGdldExvY2FsZURhdGE6IHRydWUsXG4gIHN1YnNjcmliZTogdHJ1ZSxcbiAgX186IHRydWUsXG4gIF94OiB0cnVlLFxuICBfbjogdHJ1ZSxcbiAgX254OiB0cnVlLFxuICBpc1JUTDogdHJ1ZSxcbiAgaGFzVHJhbnNsYXRpb246IHRydWVcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX1wiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZGVmYXVsdEkxOG4uX187XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX25cIiwge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2RlZmF1bHRJMThuLl9uO1xuICB9XG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9ueFwiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZGVmYXVsdEkxOG4uX254O1xuICB9XG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl94XCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0STE4bi5feDtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJkZWZhdWx0STE4blwiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZGVmYXVsdEkxOG4uZGVmYXVsdDtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJnZXRMb2NhbGVEYXRhXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0STE4bi5nZXRMb2NhbGVEYXRhO1xuICB9XG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcImhhc1RyYW5zbGF0aW9uXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0STE4bi5oYXNUcmFuc2xhdGlvbjtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJpc1JUTFwiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZGVmYXVsdEkxOG4uaXNSVEw7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwicmVzZXRMb2NhbGVEYXRhXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0STE4bi5yZXNldExvY2FsZURhdGE7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwic2V0TG9jYWxlRGF0YVwiLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZGVmYXVsdEkxOG4uc2V0TG9jYWxlRGF0YTtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJzcHJpbnRmXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9zcHJpbnRmLnNwcmludGY7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwic3Vic2NyaWJlXCIsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9kZWZhdWx0STE4bi5zdWJzY3JpYmU7XG4gIH1cbn0pO1xuXG52YXIgX3NwcmludGYgPSByZXF1aXJlKFwiLi9zcHJpbnRmXCIpO1xuXG52YXIgX2NyZWF0ZUkxOG4gPSByZXF1aXJlKFwiLi9jcmVhdGUtaTE4blwiKTtcblxuT2JqZWN0LmtleXMoX2NyZWF0ZUkxOG4pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICBpZiAoa2V5ID09PSBcImRlZmF1bHRcIiB8fCBrZXkgPT09IFwiX19lc01vZHVsZVwiKSByZXR1cm47XG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoX2V4cG9ydE5hbWVzLCBrZXkpKSByZXR1cm47XG4gIGlmIChrZXkgaW4gZXhwb3J0cyAmJiBleHBvcnRzW2tleV0gPT09IF9jcmVhdGVJMThuW2tleV0pIHJldHVybjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX2NyZWF0ZUkxOG5ba2V5XTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbnZhciBfZGVmYXVsdEkxOG4gPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChyZXF1aXJlKFwiLi9kZWZhdWx0LWkxOG5cIikpO1xuXG5mdW5jdGlvbiBfZ2V0UmVxdWlyZVdpbGRjYXJkQ2FjaGUobm9kZUludGVyb3ApIHsgaWYgKHR5cGVvZiBXZWFrTWFwICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsOyB2YXIgY2FjaGVCYWJlbEludGVyb3AgPSBuZXcgV2Vha01hcCgpOyB2YXIgY2FjaGVOb2RlSW50ZXJvcCA9IG5ldyBXZWFrTWFwKCk7IHJldHVybiAoX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlID0gZnVuY3Rpb24gKG5vZGVJbnRlcm9wKSB7IHJldHVybiBub2RlSW50ZXJvcCA/IGNhY2hlTm9kZUludGVyb3AgOiBjYWNoZUJhYmVsSW50ZXJvcDsgfSkobm9kZUludGVyb3ApOyB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaiwgbm9kZUludGVyb3ApIHsgaWYgKCFub2RlSW50ZXJvcCAmJiBvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iaiAhPT0gXCJmdW5jdGlvblwiKSB7IHJldHVybiB7IGRlZmF1bHQ6IG9iaiB9OyB9IHZhciBjYWNoZSA9IF9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZShub2RlSW50ZXJvcCk7IGlmIChjYWNoZSAmJiBjYWNoZS5oYXMob2JqKSkgeyByZXR1cm4gY2FjaGUuZ2V0KG9iaik7IH0gdmFyIG5ld09iaiA9IHt9OyB2YXIgaGFzUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmRlZmluZVByb3BlcnR5ICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKGtleSAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyB2YXIgZGVzYyA9IGhhc1Byb3BlcnR5RGVzY3JpcHRvciA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpIDogbnVsbDsgaWYgKGRlc2MgJiYgKGRlc2MuZ2V0IHx8IGRlc2Muc2V0KSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkobmV3T2JqLCBrZXksIGRlc2MpOyB9IGVsc2UgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgaWYgKGNhY2hlKSB7IGNhY2hlLnNldChvYmosIG5ld09iaik7IH0gcmV0dXJuIG5ld09iajsgfVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZShcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvaW50ZXJvcFJlcXVpcmVEZWZhdWx0XCIpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5zcHJpbnRmID0gc3ByaW50ZjtcblxudmFyIF9tZW1pemUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCJtZW1pemVcIikpO1xuXG52YXIgX3NwcmludGZKcyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcInNwcmludGYtanNcIikpO1xuXG4vKipcbiAqIEV4dGVybmFsIGRlcGVuZGVuY2llc1xuICovXG5cbi8qKlxuICogTG9nIHRvIGNvbnNvbGUsIG9uY2UgcGVyIG1lc3NhZ2U7IG9yIG1vcmUgcHJlY2lzZWx5LCBwZXIgcmVmZXJlbnRpYWxseSBlcXVhbFxuICogYXJndW1lbnQgc2V0LiBCZWNhdXNlIEplZCB0aHJvd3MgZXJyb3JzLCB3ZSBsb2cgdGhlc2UgdG8gdGhlIGNvbnNvbGUgaW5zdGVhZFxuICogdG8gYXZvaWQgY3Jhc2hpbmcgdGhlIGFwcGxpY2F0aW9uLlxuICpcbiAqIEBwYXJhbSB7Li4uKn0gYXJncyBBcmd1bWVudHMgdG8gcGFzcyB0byBgY29uc29sZS5lcnJvcmBcbiAqL1xuY29uc3QgbG9nRXJyb3JPbmNlID0gKDAsIF9tZW1pemUuZGVmYXVsdCkoY29uc29sZS5lcnJvcik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuXG4vKipcbiAqIFJldHVybnMgYSBmb3JtYXR0ZWQgc3RyaW5nLiBJZiBhbiBlcnJvciBvY2N1cnMgaW4gYXBwbHlpbmcgdGhlIGZvcm1hdCwgdGhlXG4gKiBvcmlnaW5hbCBmb3JtYXQgc3RyaW5nIGlzIHJldHVybmVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXQgVGhlIGZvcm1hdCBvZiB0aGUgc3RyaW5nIHRvIGdlbmVyYXRlLlxuICogQHBhcmFtIHsuLi4qfSAgIGFyZ3MgICBBcmd1bWVudHMgdG8gYXBwbHkgdG8gdGhlIGZvcm1hdC5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL3NwcmludGYtanNcbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBmb3JtYXR0ZWQgc3RyaW5nLlxuICovXG5cbmZ1bmN0aW9uIHNwcmludGYoZm9ybWF0KSB7XG4gIHRyeSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zcHJpbnRmSnMuZGVmYXVsdC5zcHJpbnRmKGZvcm1hdCwgLi4uYXJncyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGxvZ0Vycm9yT25jZSgnc3ByaW50ZiBlcnJvcjogXFxuXFxuJyArIGVycm9yLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXQ7XG4gIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNwcmludGYuanMubWFwIiwiLyoqXG4gKiBNZW1pemUgb3B0aW9ucyBvYmplY3QuXG4gKlxuICogQHR5cGVkZWYgTWVtaXplT3B0aW9uc1xuICpcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4U2l6ZV0gTWF4aW11bSBzaXplIG9mIHRoZSBjYWNoZS5cbiAqL1xuXG4vKipcbiAqIEludGVybmFsIGNhY2hlIGVudHJ5LlxuICpcbiAqIEB0eXBlZGVmIE1lbWl6ZUNhY2hlTm9kZVxuICpcbiAqIEBwcm9wZXJ0eSB7P01lbWl6ZUNhY2hlTm9kZXx1bmRlZmluZWR9IFtwcmV2XSBQcmV2aW91cyBub2RlLlxuICogQHByb3BlcnR5IHs/TWVtaXplQ2FjaGVOb2RlfHVuZGVmaW5lZH0gW25leHRdIE5leHQgbm9kZS5cbiAqIEBwcm9wZXJ0eSB7QXJyYXk8Kj59ICAgICAgICAgICAgICAgICAgIGFyZ3MgICBGdW5jdGlvbiBhcmd1bWVudHMgZm9yIGNhY2hlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkuXG4gKiBAcHJvcGVydHkgeyp9ICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgICAgRnVuY3Rpb24gcmVzdWx0LlxuICovXG5cbi8qKlxuICogUHJvcGVydGllcyBvZiB0aGUgZW5oYW5jZWQgZnVuY3Rpb24gZm9yIGNvbnRyb2xsaW5nIGNhY2hlLlxuICpcbiAqIEB0eXBlZGVmIE1lbWl6ZU1lbW9pemVkRnVuY3Rpb25cbiAqXG4gKiBAcHJvcGVydHkgeygpPT52b2lkfSBjbGVhciBDbGVhciB0aGUgY2FjaGUuXG4gKi9cblxuLyoqXG4gKiBBY2NlcHRzIGEgZnVuY3Rpb24gdG8gYmUgbWVtb2l6ZWQsIGFuZCByZXR1cm5zIGEgbmV3IG1lbW9pemVkIGZ1bmN0aW9uLCB3aXRoXG4gKiBvcHRpb25hbCBvcHRpb25zLlxuICpcbiAqIEB0ZW1wbGF0ZSB7RnVuY3Rpb259IEZcbiAqXG4gKiBAcGFyYW0ge0Z9ICAgICAgICAgICAgIGZuICAgICAgICBGdW5jdGlvbiB0byBtZW1vaXplLlxuICogQHBhcmFtIHtNZW1pemVPcHRpb25zfSBbb3B0aW9uc10gT3B0aW9ucyBvYmplY3QuXG4gKlxuICogQHJldHVybiB7RiAmIE1lbWl6ZU1lbW9pemVkRnVuY3Rpb259IE1lbW9pemVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtZW1pemUoIGZuLCBvcHRpb25zICkge1xuXHR2YXIgc2l6ZSA9IDA7XG5cblx0LyoqIEB0eXBlIHs/TWVtaXplQ2FjaGVOb2RlfHVuZGVmaW5lZH0gKi9cblx0dmFyIGhlYWQ7XG5cblx0LyoqIEB0eXBlIHs/TWVtaXplQ2FjaGVOb2RlfHVuZGVmaW5lZH0gKi9cblx0dmFyIHRhaWw7XG5cblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0ZnVuY3Rpb24gbWVtb2l6ZWQoIC8qIC4uLmFyZ3MgKi8gKSB7XG5cdFx0dmFyIG5vZGUgPSBoZWFkLFxuXHRcdFx0bGVuID0gYXJndW1lbnRzLmxlbmd0aCxcblx0XHRcdGFyZ3MsIGk7XG5cblx0XHRzZWFyY2hDYWNoZTogd2hpbGUgKCBub2RlICkge1xuXHRcdFx0Ly8gUGVyZm9ybSBhIHNoYWxsb3cgZXF1YWxpdHkgdGVzdCB0byBjb25maXJtIHRoYXQgd2hldGhlciB0aGUgbm9kZVxuXHRcdFx0Ly8gdW5kZXIgdGVzdCBpcyBhIGNhbmRpZGF0ZSBmb3IgdGhlIGFyZ3VtZW50cyBwYXNzZWQuIFR3byBhcnJheXNcblx0XHRcdC8vIGFyZSBzaGFsbG93bHkgZXF1YWwgaWYgdGhlaXIgbGVuZ3RoIG1hdGNoZXMgYW5kIGVhY2ggZW50cnkgaXNcblx0XHRcdC8vIHN0cmljdGx5IGVxdWFsIGJldHdlZW4gdGhlIHR3byBzZXRzLiBBdm9pZCBhYnN0cmFjdGluZyB0byBhXG5cdFx0XHQvLyBmdW5jdGlvbiB3aGljaCBjb3VsZCBpbmN1ciBhbiBhcmd1bWVudHMgbGVha2luZyBkZW9wdGltaXphdGlvbi5cblxuXHRcdFx0Ly8gQ2hlY2sgd2hldGhlciBub2RlIGFyZ3VtZW50cyBtYXRjaCBhcmd1bWVudHMgbGVuZ3RoXG5cdFx0XHRpZiAoIG5vZGUuYXJncy5sZW5ndGggIT09IGFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRcdG5vZGUgPSBub2RlLm5leHQ7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDaGVjayB3aGV0aGVyIG5vZGUgYXJndW1lbnRzIG1hdGNoIGFyZ3VtZW50cyB2YWx1ZXNcblx0XHRcdGZvciAoIGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdGlmICggbm9kZS5hcmdzWyBpIF0gIT09IGFyZ3VtZW50c1sgaSBdICkge1xuXHRcdFx0XHRcdG5vZGUgPSBub2RlLm5leHQ7XG5cdFx0XHRcdFx0Y29udGludWUgc2VhcmNoQ2FjaGU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQXQgdGhpcyBwb2ludCB3ZSBjYW4gYXNzdW1lIHdlJ3ZlIGZvdW5kIGEgbWF0Y2hcblxuXHRcdFx0Ly8gU3VyZmFjZSBtYXRjaGVkIG5vZGUgdG8gaGVhZCBpZiBub3QgYWxyZWFkeVxuXHRcdFx0aWYgKCBub2RlICE9PSBoZWFkICkge1xuXHRcdFx0XHQvLyBBcyB0YWlsLCBzaGlmdCB0byBwcmV2aW91cy4gTXVzdCBvbmx5IHNoaWZ0IGlmIG5vdCBhbHNvXG5cdFx0XHRcdC8vIGhlYWQsIHNpbmNlIGlmIGJvdGggaGVhZCBhbmQgdGFpbCwgdGhlcmUgaXMgbm8gcHJldmlvdXMuXG5cdFx0XHRcdGlmICggbm9kZSA9PT0gdGFpbCApIHtcblx0XHRcdFx0XHR0YWlsID0gbm9kZS5wcmV2O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQWRqdXN0IHNpYmxpbmdzIHRvIHBvaW50IHRvIGVhY2ggb3RoZXIuIElmIG5vZGUgd2FzIHRhaWwsXG5cdFx0XHRcdC8vIHRoaXMgYWxzbyBoYW5kbGVzIG5ldyB0YWlsJ3MgZW1wdHkgYG5leHRgIGFzc2lnbm1lbnQuXG5cdFx0XHRcdC8qKiBAdHlwZSB7TWVtaXplQ2FjaGVOb2RlfSAqLyAoIG5vZGUucHJldiApLm5leHQgPSBub2RlLm5leHQ7XG5cdFx0XHRcdGlmICggbm9kZS5uZXh0ICkge1xuXHRcdFx0XHRcdG5vZGUubmV4dC5wcmV2ID0gbm9kZS5wcmV2O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bm9kZS5uZXh0ID0gaGVhZDtcblx0XHRcdFx0bm9kZS5wcmV2ID0gbnVsbDtcblx0XHRcdFx0LyoqIEB0eXBlIHtNZW1pemVDYWNoZU5vZGV9ICovICggaGVhZCApLnByZXYgPSBub2RlO1xuXHRcdFx0XHRoZWFkID0gbm9kZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmV0dXJuIGltbWVkaWF0ZWx5XG5cdFx0XHRyZXR1cm4gbm9kZS52YWw7XG5cdFx0fVxuXG5cdFx0Ly8gTm8gY2FjaGVkIHZhbHVlIGZvdW5kLiBDb250aW51ZSB0byBpbnNlcnRpb24gcGhhc2U6XG5cblx0XHQvLyBDcmVhdGUgYSBjb3B5IG9mIGFyZ3VtZW50cyAoYXZvaWQgbGVha2luZyBkZW9wdGltaXphdGlvbilcblx0XHRhcmdzID0gbmV3IEFycmF5KCBsZW4gKTtcblx0XHRmb3IgKCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0YXJnc1sgaSBdID0gYXJndW1lbnRzWyBpIF07XG5cdFx0fVxuXG5cdFx0bm9kZSA9IHtcblx0XHRcdGFyZ3M6IGFyZ3MsXG5cblx0XHRcdC8vIEdlbmVyYXRlIHRoZSByZXN1bHQgZnJvbSBvcmlnaW5hbCBmdW5jdGlvblxuXHRcdFx0dmFsOiBmbi5hcHBseSggbnVsbCwgYXJncyApLFxuXHRcdH07XG5cblx0XHQvLyBEb24ndCBuZWVkIHRvIGNoZWNrIHdoZXRoZXIgbm9kZSBpcyBhbHJlYWR5IGhlYWQsIHNpbmNlIGl0IHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIHJldHVybmVkIGFib3ZlIGFscmVhZHkgaWYgaXQgd2FzXG5cblx0XHQvLyBTaGlmdCBleGlzdGluZyBoZWFkIGRvd24gbGlzdFxuXHRcdGlmICggaGVhZCApIHtcblx0XHRcdGhlYWQucHJldiA9IG5vZGU7XG5cdFx0XHRub2RlLm5leHQgPSBoZWFkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBJZiBubyBoZWFkLCBmb2xsb3dzIHRoYXQgdGhlcmUncyBubyB0YWlsIChhdCBpbml0aWFsIG9yIHJlc2V0KVxuXHRcdFx0dGFpbCA9IG5vZGU7XG5cdFx0fVxuXG5cdFx0Ly8gVHJpbSB0YWlsIGlmIHdlJ3JlIHJlYWNoZWQgbWF4IHNpemUgYW5kIGFyZSBwZW5kaW5nIGNhY2hlIGluc2VydGlvblxuXHRcdGlmICggc2l6ZSA9PT0gLyoqIEB0eXBlIHtNZW1pemVPcHRpb25zfSAqLyAoIG9wdGlvbnMgKS5tYXhTaXplICkge1xuXHRcdFx0dGFpbCA9IC8qKiBAdHlwZSB7TWVtaXplQ2FjaGVOb2RlfSAqLyAoIHRhaWwgKS5wcmV2O1xuXHRcdFx0LyoqIEB0eXBlIHtNZW1pemVDYWNoZU5vZGV9ICovICggdGFpbCApLm5leHQgPSBudWxsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzaXplKys7XG5cdFx0fVxuXG5cdFx0aGVhZCA9IG5vZGU7XG5cblx0XHRyZXR1cm4gbm9kZS52YWw7XG5cdH1cblxuXHRtZW1vaXplZC5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHRcdGhlYWQgPSBudWxsO1xuXHRcdHRhaWwgPSBudWxsO1xuXHRcdHNpemUgPSAwO1xuXHR9O1xuXG5cdGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICd0ZXN0JyApIHtcblx0XHQvLyBDYWNoZSBpcyBub3QgZXhwb3NlZCBpbiB0aGUgcHVibGljIEFQSSwgYnV0IHVzZWQgaW4gdGVzdHMgdG8gZW5zdXJlXG5cdFx0Ly8gZXhwZWN0ZWQgbGlzdCBwcm9ncmVzc2lvblxuXHRcdG1lbW9pemVkLmdldENhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gWyBoZWFkLCB0YWlsLCBzaXplIF07XG5cdFx0fTtcblx0fVxuXG5cdC8vIElnbm9yZSByZWFzb246IFRoZXJlJ3Mgbm90IGEgY2xlYXIgc29sdXRpb24gdG8gY3JlYXRlIGFuIGludGVyc2VjdGlvbiBvZlxuXHQvLyB0aGUgZnVuY3Rpb24gd2l0aCBhZGRpdGlvbmFsIHByb3BlcnRpZXMsIHdoZXJlIHRoZSBnb2FsIGlzIHRvIHJldGFpbiB0aGVcblx0Ly8gZnVuY3Rpb24gc2lnbmF0dXJlIG9mIHRoZSBpbmNvbWluZyBhcmd1bWVudCBhbmQgYWRkIGNvbnRyb2wgcHJvcGVydGllc1xuXHQvLyBvbiB0aGUgcmV0dXJuIHZhbHVlLlxuXG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIG1lbW9pemVkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1lbWl6ZTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiBnbG9iYWwgd2luZG93LCBleHBvcnRzLCBkZWZpbmUgKi9cblxuIWZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0J1xuXG4gICAgdmFyIHJlID0ge1xuICAgICAgICBub3Rfc3RyaW5nOiAvW15zXS8sXG4gICAgICAgIG5vdF9ib29sOiAvW150XS8sXG4gICAgICAgIG5vdF90eXBlOiAvW15UXS8sXG4gICAgICAgIG5vdF9wcmltaXRpdmU6IC9bXnZdLyxcbiAgICAgICAgbnVtYmVyOiAvW2RpZWZnXS8sXG4gICAgICAgIG51bWVyaWNfYXJnOiAvW2JjZGllZmd1eFhdLyxcbiAgICAgICAganNvbjogL1tqXS8sXG4gICAgICAgIG5vdF9qc29uOiAvW15qXS8sXG4gICAgICAgIHRleHQ6IC9eW15cXHgyNV0rLyxcbiAgICAgICAgbW9kdWxvOiAvXlxceDI1ezJ9LyxcbiAgICAgICAgcGxhY2Vob2xkZXI6IC9eXFx4MjUoPzooWzEtOV1cXGQqKVxcJHxcXCgoW14pXSspXFwpKT8oXFwrKT8oMHwnW14kXSk/KC0pPyhcXGQrKT8oPzpcXC4oXFxkKykpPyhbYi1naWpvc3RUdXZ4WF0pLyxcbiAgICAgICAga2V5OiAvXihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBrZXlfYWNjZXNzOiAvXlxcLihbYS16X11bYS16X1xcZF0qKS9pLFxuICAgICAgICBpbmRleF9hY2Nlc3M6IC9eXFxbKFxcZCspXFxdLyxcbiAgICAgICAgc2lnbjogL15bKy1dL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNwcmludGYoa2V5KSB7XG4gICAgICAgIC8vIGBhcmd1bWVudHNgIGlzIG5vdCBhbiBhcnJheSwgYnV0IHNob3VsZCBiZSBmaW5lIGZvciB0aGlzIGNhbGxcbiAgICAgICAgcmV0dXJuIHNwcmludGZfZm9ybWF0KHNwcmludGZfcGFyc2Uoa2V5KSwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZzcHJpbnRmKGZtdCwgYXJndikge1xuICAgICAgICByZXR1cm4gc3ByaW50Zi5hcHBseShudWxsLCBbZm10XS5jb25jYXQoYXJndiB8fCBbXSkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3ByaW50Zl9mb3JtYXQocGFyc2VfdHJlZSwgYXJndikge1xuICAgICAgICB2YXIgY3Vyc29yID0gMSwgdHJlZV9sZW5ndGggPSBwYXJzZV90cmVlLmxlbmd0aCwgYXJnLCBvdXRwdXQgPSAnJywgaSwgaywgcGgsIHBhZCwgcGFkX2NoYXJhY3RlciwgcGFkX2xlbmd0aCwgaXNfcG9zaXRpdmUsIHNpZ25cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRyZWVfbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VfdHJlZVtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gcGFyc2VfdHJlZVtpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHBhcnNlX3RyZWVbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgcGggPSBwYXJzZV90cmVlW2ldIC8vIGNvbnZlbmllbmNlIHB1cnBvc2VzIG9ubHlcbiAgICAgICAgICAgICAgICBpZiAocGgua2V5cykgeyAvLyBrZXl3b3JkIGFyZ3VtZW50XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbY3Vyc29yXVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgcGgua2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3ByaW50ZignW3NwcmludGZdIENhbm5vdCBhY2Nlc3MgcHJvcGVydHkgXCIlc1wiIG9mIHVuZGVmaW5lZCB2YWx1ZSBcIiVzXCInLCBwaC5rZXlzW2tdLCBwaC5rZXlzW2stMV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnW3BoLmtleXNba11dXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGgucGFyYW1fbm8pIHsgLy8gcG9zaXRpb25hbCBhcmd1bWVudCAoZXhwbGljaXQpXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3ZbcGgucGFyYW1fbm9dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50IChpbXBsaWNpdClcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndltjdXJzb3IrK11cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubm90X3R5cGUudGVzdChwaC50eXBlKSAmJiByZS5ub3RfcHJpbWl0aXZlLnRlc3QocGgudHlwZSkgJiYgYXJnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmUubnVtZXJpY19hcmcudGVzdChwaC50eXBlKSAmJiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicgJiYgaXNOYU4oYXJnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzcHJpbnRmKCdbc3ByaW50Zl0gZXhwZWN0aW5nIG51bWJlciBidXQgZm91bmQgJVQnLCBhcmcpKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZS5udW1iZXIudGVzdChwaC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBpc19wb3NpdGl2ZSA9IGFyZyA+PSAwXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwaC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMCkudG9TdHJpbmcoMilcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChhcmcsIDEwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IHBhcnNlSW50KGFyZywgMTApXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdqJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IEpTT04uc3RyaW5naWZ5KGFyZywgbnVsbCwgcGgud2lkdGggPyBwYXJzZUludChwaC53aWR0aCkgOiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwaC5wcmVjaXNpb24gPyBwYXJzZUZsb2F0KGFyZykudG9FeHBvbmVudGlhbChwaC5wcmVjaXNpb24pIDogcGFyc2VGbG9hdChhcmcpLnRvRXhwb25lbnRpYWwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBwaC5wcmVjaXNpb24gPyBwYXJzZUZsb2F0KGFyZykudG9GaXhlZChwaC5wcmVjaXNpb24pIDogcGFyc2VGbG9hdChhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdnJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IHBoLnByZWNpc2lvbiA/IFN0cmluZyhOdW1iZXIoYXJnLnRvUHJlY2lzaW9uKHBoLnByZWNpc2lvbikpKSA6IHBhcnNlRmxvYXQoYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGFyc2VJbnQoYXJnLCAxMCkgPj4+IDApLnRvU3RyaW5nKDgpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyA9IFN0cmluZyhhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGgucHJlY2lzaW9uID8gYXJnLnN1YnN0cmluZygwLCBwaC5wcmVjaXNpb24pIDogYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBTdHJpbmcoISFhcmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSAocGgucHJlY2lzaW9uID8gYXJnLnN1YnN0cmluZygwLCBwaC5wcmVjaXNpb24pIDogYXJnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBoLnByZWNpc2lvbiA/IGFyZy5zdWJzdHJpbmcoMCwgcGgucHJlY2lzaW9uKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gcGFyc2VJbnQoYXJnLCAxMCkgPj4+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3YnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnZhbHVlT2YoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBoLnByZWNpc2lvbiA/IGFyZy5zdWJzdHJpbmcoMCwgcGgucHJlY2lzaW9uKSA6IGFyZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBhcnNlSW50KGFyZywgMTApID4+PiAwKS50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnID0gKHBhcnNlSW50KGFyZywgMTApID4+PiAwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlLmpzb24udGVzdChwaC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmUubnVtYmVyLnRlc3QocGgudHlwZSkgJiYgKCFpc19wb3NpdGl2ZSB8fCBwaC5zaWduKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9IGlzX3Bvc2l0aXZlID8gJysnIDogJy0nXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudG9TdHJpbmcoKS5yZXBsYWNlKHJlLnNpZ24sICcnKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbiA9ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXJhY3RlciA9IHBoLnBhZF9jaGFyID8gcGgucGFkX2NoYXIgPT09ICcwJyA/ICcwJyA6IHBoLnBhZF9jaGFyLmNoYXJBdCgxKSA6ICcgJ1xuICAgICAgICAgICAgICAgICAgICBwYWRfbGVuZ3RoID0gcGgud2lkdGggLSAoc2lnbiArIGFyZykubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHBhZCA9IHBoLndpZHRoID8gKHBhZF9sZW5ndGggPiAwID8gcGFkX2NoYXJhY3Rlci5yZXBlYXQocGFkX2xlbmd0aCkgOiAnJykgOiAnJ1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgKz0gcGguYWxpZ24gPyBzaWduICsgYXJnICsgcGFkIDogKHBhZF9jaGFyYWN0ZXIgPT09ICcwJyA/IHNpZ24gKyBwYWQgKyBhcmcgOiBwYWQgKyBzaWduICsgYXJnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0XG4gICAgfVxuXG4gICAgdmFyIHNwcmludGZfY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBmdW5jdGlvbiBzcHJpbnRmX3BhcnNlKGZtdCkge1xuICAgICAgICBpZiAoc3ByaW50Zl9jYWNoZVtmbXRdKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ByaW50Zl9jYWNoZVtmbXRdXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX2ZtdCA9IGZtdCwgbWF0Y2gsIHBhcnNlX3RyZWUgPSBbXSwgYXJnX25hbWVzID0gMFxuICAgICAgICB3aGlsZSAoX2ZtdCkge1xuICAgICAgICAgICAgaWYgKChtYXRjaCA9IHJlLnRleHQuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlLnB1c2gobWF0Y2hbMF0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgobWF0Y2ggPSByZS5tb2R1bG8uZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJzZV90cmVlLnB1c2goJyUnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoKG1hdGNoID0gcmUucGxhY2Vob2xkZXIuZXhlYyhfZm10KSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDFcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX2xpc3QgPSBbXSwgcmVwbGFjZW1lbnRfZmllbGQgPSBtYXRjaFsyXSwgZmllbGRfbWF0Y2ggPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5LmV4ZWMocmVwbGFjZW1lbnRfZmllbGQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdC5wdXNoKGZpZWxkX21hdGNoWzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChyZXBsYWNlbWVudF9maWVsZCA9IHJlcGxhY2VtZW50X2ZpZWxkLnN1YnN0cmluZyhmaWVsZF9tYXRjaFswXS5sZW5ndGgpKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpZWxkX21hdGNoID0gcmUua2V5X2FjY2Vzcy5leGVjKHJlcGxhY2VtZW50X2ZpZWxkKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRfbGlzdC5wdXNoKGZpZWxkX21hdGNoWzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoZmllbGRfbWF0Y2ggPSByZS5pbmRleF9hY2Nlc3MuZXhlYyhyZXBsYWNlbWVudF9maWVsZCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkX2xpc3QucHVzaChmaWVsZF9tYXRjaFsxXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcignW3NwcmludGZdIGZhaWxlZCB0byBwYXJzZSBuYW1lZCBhcmd1bWVudCBrZXknKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gZmllbGRfbGlzdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnX25hbWVzIHw9IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ19uYW1lcyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tzcHJpbnRmXSBtaXhpbmcgcG9zaXRpb25hbCBhbmQgbmFtZWQgcGxhY2Vob2xkZXJzIGlzIG5vdCAoeWV0KSBzdXBwb3J0ZWQnKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcnNlX3RyZWUucHVzaChcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1fbm86ICAgIG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5czogICAgICAgIG1hdGNoWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbjogICAgICAgIG1hdGNoWzNdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkX2NoYXI6ICAgIG1hdGNoWzRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICAgICAgIG1hdGNoWzVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICAgICAgIG1hdGNoWzZdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uOiAgIG1hdGNoWzddLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogICAgICAgIG1hdGNoWzhdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoJ1tzcHJpbnRmXSB1bmV4cGVjdGVkIHBsYWNlaG9sZGVyJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mbXQgPSBfZm10LnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNwcmludGZfY2FjaGVbZm10XSA9IHBhcnNlX3RyZWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBleHBvcnQgdG8gZWl0aGVyIGJyb3dzZXIgb3Igbm9kZS5qc1xuICAgICAqL1xuICAgIC8qIGVzbGludC1kaXNhYmxlIHF1b3RlLXByb3BzICovXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBleHBvcnRzWydzcHJpbnRmJ10gPSBzcHJpbnRmXG4gICAgICAgIGV4cG9ydHNbJ3ZzcHJpbnRmJ10gPSB2c3ByaW50ZlxuICAgIH1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93WydzcHJpbnRmJ10gPSBzcHJpbnRmXG4gICAgICAgIHdpbmRvd1sndnNwcmludGYnXSA9IHZzcHJpbnRmXG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICdzcHJpbnRmJzogc3ByaW50ZixcbiAgICAgICAgICAgICAgICAgICAgJ3ZzcHJpbnRmJzogdnNwcmludGZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qIGVzbGludC1lbmFibGUgcXVvdGUtcHJvcHMgKi9cbn0oKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcERlZmF1bHQgKGV4KSB7IHJldHVybiAoZXggJiYgKHR5cGVvZiBleCA9PT0gJ29iamVjdCcpICYmICdkZWZhdWx0JyBpbiBleCkgPyBleFsnZGVmYXVsdCddIDogZXg7IH1cblxudmFyIHBsdXJhbEZvcm1zID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0B0YW5uaW4vcGx1cmFsLWZvcm1zJykpO1xuXG4vKipcbiAqIFRhbm5pbiBjb25zdHJ1Y3RvciBvcHRpb25zLlxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFRhbm5pbk9wdGlvbnNcbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gICBbY29udGV4dERlbGltaXRlcl0gSm9pbmVyIGluIHN0cmluZyBsb29rdXAgd2l0aCBjb250ZXh0LlxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gW29uTWlzc2luZ0tleV0gICAgIENhbGxiYWNrIHRvIGludm9rZSB3aGVuIGtleSBtaXNzaW5nLlxuICovXG5cbi8qKlxuICogRG9tYWluIG1ldGFkYXRhLlxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFRhbm5pbkRvbWFpbk1ldGFkYXRhXG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9ICAgICAgICAgICAgW2RvbWFpbl0gICAgICAgRG9tYWluIG5hbWUuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gICAgICAgICAgICBbbGFuZ10gICAgICAgICBMYW5ndWFnZSBjb2RlLlxuICogQHByb3BlcnR5IHsoc3RyaW5nfEZ1bmN0aW9uKX0gW3BsdXJhbF9mb3Jtc10gUGx1cmFsIGZvcm1zIGV4cHJlc3Npb24gb3JcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGV2YWx1YXRvci5cbiAqL1xuXG4vKipcbiAqIERvbWFpbiB0cmFuc2xhdGlvbiBwYWlyIHJlc3BlY3RpdmVseSByZXByZXNlbnRpbmcgdGhlIHNpbmd1bGFyIGFuZCBwbHVyYWxcbiAqIHRyYW5zbGF0aW9uLlxuICpcbiAqIEB0eXBlZGVmIHtbc3RyaW5nLHN0cmluZ119IFRhbm5pblRyYW5zbGF0aW9uXG4gKi9cblxuLyoqXG4gKiBMb2NhbGUgZGF0YSBkb21haW4uIFRoZSBrZXkgaXMgdXNlZCBhcyByZWZlcmVuY2UgZm9yIGxvb2t1cCwgdGhlIHZhbHVlIGFuXG4gKiBhcnJheSBvZiB0d28gc3RyaW5nIGVudHJpZXMgcmVzcGVjdGl2ZWx5IHJlcHJlc2VudGluZyB0aGUgc2luZ3VsYXIgYW5kIHBsdXJhbFxuICogdHJhbnNsYXRpb24uXG4gKlxuICogQHR5cGVkZWYge3tba2V5OnN0cmluZ106VGFubmluRG9tYWluTWV0YWRhdGF8VGFubmluVHJhbnNsYXRpb24sJyc6VGFubmluRG9tYWluTWV0YWRhdGF8VGFubmluVHJhbnNsYXRpb259fSBUYW5uaW5Mb2NhbGVEb21haW5cbiAqL1xuXG4vKipcbiAqIEplZC1mb3JtYXR0ZWQgbG9jYWxlIGRhdGEuXG4gKlxuICogQHNlZSBodHRwOi8vbWVzc2FnZWZvcm1hdC5naXRodWIuaW8vSmVkL1xuICpcbiAqIEB0eXBlZGVmIHt7W2RvbWFpbjpzdHJpbmddOlRhbm5pbkxvY2FsZURvbWFpbn19IFRhbm5pbkxvY2FsZURhdGFcbiAqL1xuXG4vKipcbiAqIERlZmF1bHQgVGFubmluIGNvbnN0cnVjdG9yIG9wdGlvbnMuXG4gKlxuICogQHR5cGUge1Rhbm5pbk9wdGlvbnN9XG4gKi9cbnZhciBERUZBVUxUX09QVElPTlMgPSB7XG5cdGNvbnRleHREZWxpbWl0ZXI6ICdcXHUwMDA0Jyxcblx0b25NaXNzaW5nS2V5OiBudWxsLFxufTtcblxuLyoqXG4gKiBHaXZlbiBhIHNwZWNpZmljIGxvY2FsZSBkYXRhJ3MgY29uZmlnIGBwbHVyYWxfZm9ybXNgIHZhbHVlLCByZXR1cm5zIHRoZVxuICogZXhwcmVzc2lvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYFxuICogZ2V0UGx1cmFsRXhwcmVzc2lvbiggJ25wbHVyYWxzPTI7IHBsdXJhbD0obiAhPSAxKTsnICkgPT09ICcobiAhPSAxKSdcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwZiBMb2NhbGUgZGF0YSBwbHVyYWwgZm9ybXMuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBQbHVyYWwgZm9ybXMgZXhwcmVzc2lvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0UGx1cmFsRXhwcmVzc2lvbiggcGYgKSB7XG5cdHZhciBwYXJ0cywgaSwgcGFydDtcblxuXHRwYXJ0cyA9IHBmLnNwbGl0KCAnOycgKTtcblxuXHRmb3IgKCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrICkge1xuXHRcdHBhcnQgPSBwYXJ0c1sgaSBdLnRyaW0oKTtcblx0XHRpZiAoIHBhcnQuaW5kZXhPZiggJ3BsdXJhbD0nICkgPT09IDAgKSB7XG5cdFx0XHRyZXR1cm4gcGFydC5zdWJzdHIoIDcgKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBUYW5uaW4gY29uc3RydWN0b3IuXG4gKlxuICogQGNsYXNzXG4gKlxuICogQHBhcmFtIHtUYW5uaW5Mb2NhbGVEYXRhfSBkYXRhICAgICAgSmVkLWZvcm1hdHRlZCBsb2NhbGUgZGF0YS5cbiAqIEBwYXJhbSB7VGFubmluT3B0aW9uc30gICAgW29wdGlvbnNdIFRhbm5pbiBvcHRpb25zLlxuICovXG5mdW5jdGlvbiBUYW5uaW4oIGRhdGEsIG9wdGlvbnMgKSB7XG5cdHZhciBrZXk7XG5cblx0LyoqXG5cdCAqIEplZC1mb3JtYXR0ZWQgbG9jYWxlIGRhdGEuXG5cdCAqXG5cdCAqIEBuYW1lIFRhbm5pbiNkYXRhXG5cdCAqIEB0eXBlIHtUYW5uaW5Mb2NhbGVEYXRhfVxuXHQgKi9cblx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHQvKipcblx0ICogUGx1cmFsIGZvcm1zIGZ1bmN0aW9uIGNhY2hlLCBrZXllZCBieSBwbHVyYWwgZm9ybXMgc3RyaW5nLlxuXHQgKlxuXHQgKiBAbmFtZSBUYW5uaW4jcGx1cmFsRm9ybXNcblx0ICogQHR5cGUge09iamVjdDxzdHJpbmcsRnVuY3Rpb24+fVxuXHQgKi9cblx0dGhpcy5wbHVyYWxGb3JtcyA9IHt9O1xuXG5cdC8qKlxuXHQgKiBFZmZlY3RpdmUgb3B0aW9ucyBmb3IgaW5zdGFuY2UsIGluY2x1ZGluZyBkZWZhdWx0cy5cblx0ICpcblx0ICogQG5hbWUgVGFubmluI29wdGlvbnNcblx0ICogQHR5cGUge1Rhbm5pbk9wdGlvbnN9XG5cdCAqL1xuXHR0aGlzLm9wdGlvbnMgPSB7fTtcblxuXHRmb3IgKCBrZXkgaW4gREVGQVVMVF9PUFRJT05TICkge1xuXHRcdHRoaXMub3B0aW9uc1sga2V5IF0gPSBvcHRpb25zICE9PSB1bmRlZmluZWQgJiYga2V5IGluIG9wdGlvbnNcblx0XHRcdD8gb3B0aW9uc1sga2V5IF1cblx0XHRcdDogREVGQVVMVF9PUFRJT05TWyBrZXkgXTtcblx0fVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHBsdXJhbCBmb3JtIGluZGV4IGZvciB0aGUgZ2l2ZW4gZG9tYWluIGFuZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9tYWluIERvbWFpbiBvbiB3aGljaCB0byBjYWxjdWxhdGUgcGx1cmFsIGZvcm0uXG4gKiBAcGFyYW0ge251bWJlcn0gbiAgICAgIFZhbHVlIGZvciB3aGljaCBwbHVyYWwgZm9ybSBpcyB0byBiZSBjYWxjdWxhdGVkLlxuICpcbiAqIEByZXR1cm4ge251bWJlcn0gUGx1cmFsIGZvcm0gaW5kZXguXG4gKi9cblRhbm5pbi5wcm90b3R5cGUuZ2V0UGx1cmFsRm9ybSA9IGZ1bmN0aW9uKCBkb21haW4sIG4gKSB7XG5cdHZhciBnZXRQbHVyYWxGb3JtID0gdGhpcy5wbHVyYWxGb3Jtc1sgZG9tYWluIF0sXG5cdFx0Y29uZmlnLCBwbHVyYWwsIHBmO1xuXG5cdGlmICggISBnZXRQbHVyYWxGb3JtICkge1xuXHRcdGNvbmZpZyA9IHRoaXMuZGF0YVsgZG9tYWluIF1bICcnIF07XG5cblx0XHRwZiA9IChcblx0XHRcdGNvbmZpZ1sgJ1BsdXJhbC1Gb3JtcycgXSB8fFxuXHRcdFx0Y29uZmlnWyAncGx1cmFsLWZvcm1zJyBdIHx8XG5cdFx0XHQvLyBJZ25vcmUgcmVhc29uOiBBcyBrbm93biwgdGhlcmUncyBubyB3YXkgdG8gZG9jdW1lbnQgdGhlIGVtcHR5XG5cdFx0XHQvLyBzdHJpbmcgcHJvcGVydHkgb24gYSBrZXkgdG8gZ3VhcmFudGVlIHRoaXMgYXMgbWV0YWRhdGEuXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRjb25maWcucGx1cmFsX2Zvcm1zXG5cdFx0KTtcblxuXHRcdGlmICggdHlwZW9mIHBmICE9PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0cGx1cmFsID0gZ2V0UGx1cmFsRXhwcmVzc2lvbihcblx0XHRcdFx0Y29uZmlnWyAnUGx1cmFsLUZvcm1zJyBdIHx8XG5cdFx0XHRcdGNvbmZpZ1sgJ3BsdXJhbC1mb3JtcycgXSB8fFxuXHRcdFx0XHQvLyBJZ25vcmUgcmVhc29uOiBBcyBrbm93biwgdGhlcmUncyBubyB3YXkgdG8gZG9jdW1lbnQgdGhlIGVtcHR5XG5cdFx0XHRcdC8vIHN0cmluZyBwcm9wZXJ0eSBvbiBhIGtleSB0byBndWFyYW50ZWUgdGhpcyBhcyBtZXRhZGF0YS5cblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRjb25maWcucGx1cmFsX2Zvcm1zXG5cdFx0XHQpO1xuXG5cdFx0XHRwZiA9IHBsdXJhbEZvcm1zKCBwbHVyYWwgKTtcblx0XHR9XG5cblx0XHRnZXRQbHVyYWxGb3JtID0gdGhpcy5wbHVyYWxGb3Jtc1sgZG9tYWluIF0gPSBwZjtcblx0fVxuXG5cdHJldHVybiBnZXRQbHVyYWxGb3JtKCBuICk7XG59O1xuXG4vKipcbiAqIFRyYW5zbGF0ZSBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICBkb21haW4gICBUcmFuc2xhdGlvbiBkb21haW4uXG4gKiBAcGFyYW0ge3N0cmluZ3x2b2lkfSBjb250ZXh0ICBDb250ZXh0IGRpc3Rpbmd1aXNoaW5nIHRlcm1zIG9mIHRoZSBzYW1lIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICBzaW5ndWxhciBQcmltYXJ5IGtleSBmb3IgdHJhbnNsYXRpb24gbG9va3VwLlxuICogQHBhcmFtIHtzdHJpbmc9fSAgICAgcGx1cmFsICAgRmFsbGJhY2sgdmFsdWUgdXNlZCBmb3Igbm9uLXplcm8gcGx1cmFsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtIGluZGV4LlxuICogQHBhcmFtIHtudW1iZXI9fSAgICAgbiAgICAgICAgVmFsdWUgdG8gdXNlIGluIGNhbGN1bGF0aW5nIHBsdXJhbCBmb3JtLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVHJhbnNsYXRlZCBzdHJpbmcuXG4gKi9cblRhbm5pbi5wcm90b3R5cGUuZGNucGdldHRleHQgPSBmdW5jdGlvbiggZG9tYWluLCBjb250ZXh0LCBzaW5ndWxhciwgcGx1cmFsLCBuICkge1xuXHR2YXIgaW5kZXgsIGtleSwgZW50cnk7XG5cblx0aWYgKCBuID09PSB1bmRlZmluZWQgKSB7XG5cdFx0Ly8gRGVmYXVsdCB0byBzaW5ndWxhci5cblx0XHRpbmRleCA9IDA7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gRmluZCBpbmRleCBieSBldmFsdWF0aW5nIHBsdXJhbCBmb3JtIGZvciB2YWx1ZS5cblx0XHRpbmRleCA9IHRoaXMuZ2V0UGx1cmFsRm9ybSggZG9tYWluLCBuICk7XG5cdH1cblxuXHRrZXkgPSBzaW5ndWxhcjtcblxuXHQvLyBJZiBwcm92aWRlZCwgY29udGV4dCBpcyBwcmVwZW5kZWQgdG8ga2V5IHdpdGggZGVsaW1pdGVyLlxuXHRpZiAoIGNvbnRleHQgKSB7XG5cdFx0a2V5ID0gY29udGV4dCArIHRoaXMub3B0aW9ucy5jb250ZXh0RGVsaW1pdGVyICsgc2luZ3VsYXI7XG5cdH1cblxuXHRlbnRyeSA9IHRoaXMuZGF0YVsgZG9tYWluIF1bIGtleSBdO1xuXG5cdC8vIFZlcmlmeSBub3Qgb25seSB0aGF0IGVudHJ5IGV4aXN0cywgYnV0IHRoYXQgdGhlIGludGVuZGVkIGluZGV4IGlzIHdpdGhpblxuXHQvLyByYW5nZSBhbmQgbm9uLWVtcHR5LlxuXHRpZiAoIGVudHJ5ICYmIGVudHJ5WyBpbmRleCBdICkge1xuXHRcdHJldHVybiBlbnRyeVsgaW5kZXggXTtcblx0fVxuXG5cdGlmICggdGhpcy5vcHRpb25zLm9uTWlzc2luZ0tleSApIHtcblx0XHR0aGlzLm9wdGlvbnMub25NaXNzaW5nS2V5KCBzaW5ndWxhciwgZG9tYWluICk7XG5cdH1cblxuXHQvLyBJZiBlbnRyeSBub3QgZm91bmQsIGZhbGwgYmFjayB0byBzaW5ndWxhciB2cy4gcGx1cmFsIHdpdGggemVybyBpbmRleFxuXHQvLyByZXByZXNlbnRpbmcgdGhlIHNpbmd1bGFyIHZhbHVlLlxuXHRyZXR1cm4gaW5kZXggPT09IDAgPyBzaW5ndWxhciA6IHBsdXJhbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGFubmluO1xuIiwiLyoqXG4gKiBsY2ktcG9zdC1zbGlkZXIgQUNGIEJsb2NrIEphdmFzY3JpcCBlbnRyeSBwb2ludC5cbiAqXG4gKiBAcGFja2FnZSBsY2ktcG9zdC1zbGlkZXJcbiAqL1xuXG4vKipcbiAqIFdvcmRQcmVzcyBpMThuXG4gKlxuICogX18oICdfXycsICdteS1kb21haW4nICk7XG4gKiBfeCggJ194JywgJ194X2NvbnRleHQnLCAnbXktZG9tYWluJyApO1xuICogX24oICdfbl9zaW5nbGUnLCAnX25fcGx1cmFsJywgbnVtYmVyLCAnbXktZG9tYWluJyApO1xuICogX254KCAnX254X3NpbmdsZScsICdfbnhfcGx1cmFsJywgbnVtYmVyLCAnX254X2NvbnRleHQnLCAnbXktZG9tYWluJyApO1xuICovXG4vLyByZXF1aXJlIHVzaW5nIGJhYmVsICsgaW5zdGFsbGluZyBAd29yZHByZXNzL2kxOG4gbnBtIHBhY2thZ2VzXG5pbXBvcnQgeyBfXywgX3gsIF9uLCBfbnggfSBmcm9tIFwiQHdvcmRwcmVzcy9pMThuXCJcbjsoZnVuY3Rpb24gKCkge1xuICAvLyBpMThuIHdoZW4gbm90IHVzaW5nIGJhYmVsLiBObyBuZWVkIHRvIGluc3RhbGwgQHdvcmRwcmVzcy9pMThuIG5wbSBwYWNrYWdlcyB0aGVuXG4gIC8vIGNvbnN0IHsgX18sIF94LCBfbiwgX254IH0gPSB3cC5pMThuO1xuXG4gIC8vIERPIE5PVCBVU0UgdmFyaWFibGUgdGV4dERvbWFpbiBpbiBpMThuIGZ1bmN0aW9uIG9yIHdwLWNsaSBpMThuIG1ha2UtcG90IGNvbW1hbmQgd29udCBmaW5kIHRyYW5zbGF0aW9uc1xuICAvLyBjb25zdCB0ZXh0RG9tYWluID0gXCJsY2ktcG9zdC1zbGlkZXJcIjtcblxuICAvKipcbiAgICogQ2hlY2sgaWYgRE9NIGlzIGFscmVhZHkgYXZhaWxhYmxlIHRvIGxhdW5jaCBzY3JpcHQgb3IgYWRkIGV2ZW50IGxpc3RlbmVyIHRvIGRvIHNvIGFzIHNvb24gYXMgcG9zc2libGVcbiAgICogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzk4OTk3MDFcbiAgICovXG4gIGxldCBkb2NSZWFkeSA9IGZuID0+IHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIikge1xuICAgICAgLy8gY2FsbCBvbiBuZXh0IGF2YWlsYWJsZSB0aWNrXG4gICAgICBzZXRUaW1lb3V0KGZuLCAxKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmbilcbiAgICB9XG4gIH1cblxuICBkb2NSZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgLy8gRE9NIGlzIGxvYWRlZCBhbmQgcmVhZHkgZm9yIG1hbmlwdWxhdGlvbiBoZXJlXG4gICAgY29uc29sZS5sb2coX18oXCJsY2ktcG9zdC1zbGlkZXIuanMgc3RhcnRlZCAhXCIsIFwibGNpLXBvc3Qtc2xpZGVyXCIpKVxuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgZmxpY2tpdHkgc2xpZGVycyBhbmQgaW5pdGlhbGl6ZSB0aGVtXG4gICAgICBsZXQgc2xpZGVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGNpLXBvc3Qtc2xpZGVyXCIpXG5cbiAgICAgIC8vIElmIHdlIHVzZSBiYWJlbFxuICAgICAgO1suLi5zbGlkZXJzXS5mb3JFYWNoKHNsaWRlciA9PiB7XG4gICAgICAgIGluaXRpYWxpemVCbG9jayhzbGlkZXIpXG4gICAgICB9KVxuXG4gICAgICAvLyBJZiBub3QgdXNpbmcgYmFiZWxcbiAgICAgIC8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzbGlkZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAvLyAgIGluaXRpYWxpemVCbG9jayhzbGlkZXJzW2ldKTtcbiAgICAgIC8vIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgIH1cbiAgfSlcblxuICAvKipcbiAgICogaW5pdGlhbGl6ZUJsb2NrXG4gICAqXG4gICAqIEBwYXJhbSAgIG9iamVjdCAkYmxvY2sgVGhlIGJsb2NrIGVsZW1lbnQuXG4gICAqIEByZXR1cm4gIHZvaWRcbiAgICovXG4gIGxldCBpbml0aWFsaXplQmxvY2sgPSBmdW5jdGlvbiAoJGJsb2NrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBwb3N0X3NsaWRlcl9jb250YWluZXIgPSAkYmxvY2sucXVlcnlTZWxlY3RvcihcIi5sY2ktcG9zdC1zbGlkZXItY29udGFpbmVyXCIpXG5cbiAgICAgIHBvc3Rfc2xpZGVyX2NvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtaGlkZGVuXCIpXG4gICAgICAvLyB0cmlnZ2VyIHJlZHJhdyBmb3IgdHJhbnNpdGlvblxuICAgICAgcG9zdF9zbGlkZXJfY29udGFpbmVyLm9mZnNldEhlaWdodFxuXG4gICAgICBpZiAocG9zdF9zbGlkZXJfY29udGFpbmVyKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgIGluaXRpYWxJbmRleDogMSxcbiAgICAgICAgICBpbWFnZXNMb2FkZWQ6IHRydWUsIC8vIHJlLXBvc2l0aW9ucyBjZWxscyBvbmNlIHRoZWlyIGltYWdlcyBoYXZlIGxvYWRlZFxuICAgICAgICAgIGdyb3VwQ2VsbHM6IHRydWUsIC8vIGdyb3VwIGNlbGxzIHRoYXQgZml0IGluIGNhcm91c2VsIHZpZXdwb3J0XG4gICAgICAgICAgY2VsbEFsaWduOiBwb3N0X3NsaWRlcl9jb250YWluZXIuZGF0YXNldC5jZWxsYWxpZ24sIC8vIGxlZnQsIHJpZ2h0LCBjZW50ZXJcbiAgICAgICAgICBmcmVlU2Nyb2xsOiBmYWxzZSwgLy8gZW5hYmxlcyBjb250ZW50IHRvIGJlIGZyZWVseSBzY3JvbGxlZCBhbmQgZmxpY2tlZCB3aXRob3V0IGFsaWduaW5nIGNlbGxzIHRvIGFuIGVuZCBwb3NpdGlvblxuICAgICAgICAgIHdyYXBBcm91bmQ6IHBvc3Rfc2xpZGVyX2NvbnRhaW5lci5kYXRhc2V0LndyYXBhcm91bmQgPT09IFwidHJ1ZVwiXG4gICAgICAgICAgLy8gd2F0Y2hDU1M6IHRydWVcbiAgICAgICAgICAvLyBlbmFibGUgRmxpY2tpdHkgaW4gQ1NTIHdoZW5cbiAgICAgICAgICAvLyBlbGVtZW50OmFmdGVyIHsgY29udGVudDogJ2ZsaWNraXR5JyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhvcHRpb25zKTtcblxuICAgICAgICBsZXQgc2xpZGVyID0gbmV3IEZsaWNraXR5KHBvc3Rfc2xpZGVyX2NvbnRhaW5lciwgb3B0aW9ucylcbiAgICAgIH1cbiAgICAgIC8vIGVsc2Uge1xuICAgICAgLy8gICAvLyBzbGlkZXIgZW1wdHkgb3IgZmxpY2tpdHktc2xpZGVyIHJlbmRlciB0ZW1wbGF0ZSBpcyBtaXNzaW5nIGRpdi5wb3N0X3NsaWRlcl9jb250YWluZXJcbiAgICAgIC8vIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUsICRibG9jaylcbiAgICB9XG4gIH1cblxuICAvLyBBQ0YgSmF2YXNjcmlwdCBBUElcbiAgaWYgKHdpbmRvdy5hY2YpIHtcbiAgICB3aW5kb3cuYWNmLmFkZEFjdGlvbihcbiAgICAgIC8vIEluaXRpYWxpemUgZHluYW1pYyBibG9jayBwcmV2aWV3IChlZGl0b3IpLlxuICAgICAgLy8gSWYgbmFtZXNwYWNlIGlzIG90aGVyIHRoYW4g4oCcYWNmL+KAnSB1c2UgdGhlIGZ1bGwgYmxvY2sgbmFtZSBpbiB0aGUgY2FsbGJhY2ssIHNvOsKgcmVuZGVyX2Jsb2NrX3ByZXZpZXcvdHlwZT1uYW1lc3BhY2UvbGNpLXBvc3Qtc2xpZGVyXG4gICAgICBcInJlbmRlcl9ibG9ja19wcmV2aWV3L3R5cGU9bGNpLXBvc3Qtc2xpZGVyXCIsXG4gICAgICAkYmxvY2sgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInJlbmRlciBldmVudCFcIik7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBlZGl0b3IgcHJldmlldyByZWZyZXNoIG9uIGJsb2NrJ3MgcHJvcHMgdXBkYXRlXG4gICAgICAgIGluaXRpYWxpemVCbG9jaygkYmxvY2tbMF0pXG5cbiAgICAgICAgLy8gVHJpZ2dlciBmbGlja2l0eSByZWZyZXNoIG9uIGJsb2NrJ3MgcHJvcHMgdXBkYXRlXG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlc2l6ZVwiKSlcbiAgICAgIH1cbiAgICApXG4gIH1cbn0pKClcbiJdfQ==
