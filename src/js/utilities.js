
define(function(require) {
  var Settings = require('settings');
  var Storage = require('storage');

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


  Utilities.onTransitionEnd = function( elem, fn, context ) {
    // TODO(glen): Add ability to listen for only a specific property which
    // transitioned and ignore others.
    if ( elem.jquery ) {
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


  Utilities.inherits = function( child, parent ) {
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


  Utilities.requestArtistDuplicates = function( artist ) {
    var duplicates = Storage.getArtistDuplicates(artist);
    if ( duplicates !== null ) {
      var deferred = new $.Deferred();
      deferred.resolveWith(null, [{
        duplicates: JSON.parse(duplicates)
      }]);
      return deferred.promise();
    }


    var jqXHR = $.ajax({
      url: '/artist-duplicates',
      type: 'get',
      data: {
        artist: encodeURIComponent(artist)
      },
      dataType: 'json'
    });

    // Save to session storage.
    jqXHR.done(function(data) {
      Storage.setArtistDuplicates( data.artist, data.duplicates );
    });

    return jqXHR;
  };


  Utilities.requestTopArtists = function( page ) {
    page = page || 0;
    var top = Storage.getTopArtists( page );
    if ( top !== null ) {
      var promise = new $.Deferred();
      promise.resolveWith(null, [{
        artists: top
      }]);
      return promise.promise();
    }

    var jqXHR = $.ajax({
      url: '/top-artists',
      type: 'get',
      data: {
        page: page
      },
      dataType: 'json'
    });

    jqXHR.done(function( data ) {
      Storage.setTopArtists(data.artists);
    });

    return jqXHR;
  };


  return Utilities;
});
