
define(function() {
  var Settings = {};


  Settings.transitionend = (function() {
    var el = document.createElement('div');
    var transitions = {
      'transition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd',
      'OTransition': 'oTransitionEnd',
      'MozTransition': 'transitionend'
    };

    for ( var t in transitions ) {
      if ( el.style[t] !== undefined ) {
        el = null;
        return transitions[t];
      }
    }
  })();

  return Settings;
});
