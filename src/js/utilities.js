define(function(require) {
  var Settings = require('settings');
  var Storage = require('storage');
  var socket = require('socket');

  // socket.on('later', function() {
  //   console.log('it is later');
  // });

  // socket.emit('bar', 'foo');

  var Utilities = {};


  /** @enum {string} */
  Utilities.ClassName = {
    HIDDEN: 'hidden',
    FADE: 'fade',
    IN: 'in',
    INVISIBLE: 'invisible',
    ACTIVE: 'active',
    GRAB: 'grab',
    GRABBING: 'grabbing',
    OFF_SCREEN: 'off-screen',
    LOADER: 'loader',
    ABOVE: 'above'
  };


  Utilities.onTransitionEnd = function(elem, fn, context) {
    // TODO(glen): Add ability to listen for only a specific property which
    // transitioned and ignore others.
    if (elem.jquery) {
      elem = elem[0];
    }

    var callback = $.proxy(fn, context || window);
    var fakeEvent = {
      target: elem,
      currentTarget: elem
    };

    /**
     * @param {$.Event|{target: Element, currentTarget: Element}} evt Event object.
     */
    function transitionEnded(evt) {
      var source = evt.currentTarget;
      // Some other element's transition event could have bubbled up to this.
      if (!source || source !== evt.target) {
        return;
      }

      // If the browser has transitions, there will be a listener bound to the
      // `transitionend` event which needs to be removed. `listenOnce` is not used
      // because transition events can bubble up to the parent.
      if (Modernizr.csstransitions) {
        $(source).off(Settings.transEndEventName, transitionEnded);
      }

      // Done!
      callback(evt);
    }


    if (Modernizr.csstransitions) {
      $(elem).on(Settings.transEndEventName, transitionEnded);
      // TODO(glen): Get length of transition and set a timeout as a backup.
      // The transition will not happen if the values don't change on the element,
      // the timeout would be a failsafe for that.
    } else {

      // Push to the end of the queue with a fake event which will pass the checks
      // inside the callback function.
      setTimeout($.proxy(transitionEnded, window, fakeEvent), 0);
    }
  };


  Utilities.inherits = function(child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;

    /**
     * Taken from Closure :)
     *
     * Calls superclass constructor/method.
     *
     * This function is only available if you use goog.inherits to
     * express inheritance relationships between classes.
     *
     * NOTE: This is a replacement for goog.base and for superClass_
     * property defined in child.
     *
     * @param {!Object} me Should always be "this".
     * @param {string} methodName The method name to call. Calling
     *     superclass constructor can be done with the special string
     *     'constructor'.
     * @param {...*} var_args The arguments to pass to superclass
     *     method/constructor.
     * @return {*} The return value of the superclass method/constructor.
     */
    child.base = function(me, methodName, var_args) {
      var args = Array.prototype.slice.call(arguments, 2);
      return parent.prototype[methodName].apply(me, args);
    };
  };


  // https://github.com/jquery/jquery/pull/764
  // http://stackoverflow.com/a/15717609/373422
  Utilities.getWindowHeight = function() {
    var windowHeight = window.innerHeight || Settings.$window.height();

    // Try to exclude the toolbars from the height on iPhone.
    if (Settings.isIPhone) {
      var screenHeight = screen.height;
      var toolbarHeight = screenHeight - windowHeight;
      windowHeight = screenHeight - toolbarHeight;
    }

    return windowHeight;
  };

  Utilities.waitForEvent = function(eventName) {
    return function() {
      return new Promise(function(resolve) {
        socket.once(eventName, resolve);
      });
    };
  };

  Utilities.apiStatus = function(data) {
    if (data.ok === false) {
      return Promise.reject(data);
    } else {
      return Promise.resolve(data);
    }
  };

  Utilities.status = function(response) {
    var jsonParsing = response.json();
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(jsonParsing);
    } else {
      return new Promise(function(resolve, reject) {
        jsonParsing.then(reject);
      });
    }
  };

  Utilities.requestTopArtists = function(page) {
    var stored = Storage.getTopArtists(page);

    if (stored !== null) {
      return Promise.resolve(stored);
    }

    // last.fm's api isn't zero-based here...
    var qs = '?page=' + (page + 1);
    return fetch('/top-artists' + qs, {
        credentials: 'include'
      })
      .then(Utilities.status)
      .then(function(json) {
        var artists = json.artists;
        Storage.setTopArtists(artists);
        return artists;
      });
  };


  Utilities.requestArtistDuplicates = function(artist) {
    if (artist === undefined) {
      throw new TypeError('Artist is not defined');
    }

    var stored = Storage.getArtistDuplicates(artist, true);
    if (stored !== null) {
      return Promise.resolve(stored);
    }

    console.log('Requesting duplicates for', encodeURIComponent(artist));
    var qs = '?artist=' + encodeURIComponent(artist);
    return fetch('/artist-duplicates' + qs, {
      credentials: 'include'
    })
    .then(Utilities.status)
    .then(Utilities.waitForEvent('artist-duplicates_' + artist))
    .then(Utilities.apiStatus)
    .then(function(json) {
      // Save to session storage.
      var goodResponse = Array.isArray(json.duplicates);

      if (goodResponse) {
        console.log('Saving %d duplicates for %s', json.duplicates.length, json.artist);
        Storage.setArtistDuplicates(json.artist, json.duplicates);
      } else {
        console.log('No duplicates given for %s', artist);
      }

      return json.duplicates;
    });
  };


  Utilities.enableButton = function(buttonEl) {
    buttonEl.dataset.isLoading = false;
    buttonEl.children[0].style.display = '';
    buttonEl.children[1].textContent = buttonEl.dataset.restingText;
    buttonEl.disabled = false;
  };


  Utilities.disableButton = function(buttonEl) {
    var currentText = buttonEl.children[1].textContent;

    // Write on the next frame.
    requestAnimationFrame(function() {
      buttonEl.dataset.restingText = currentText;
      buttonEl.dataset.isLoading = true;
      buttonEl.children[0].style.display = 'none';
      buttonEl.children[1].textContent = 'Loading...';
      buttonEl.disabled = true;
    });
  };


  return Utilities;
});
