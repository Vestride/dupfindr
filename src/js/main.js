
requirejs.config({
  baseUrl: 'js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min',
    promise: 'libs/promise',
    underscore: 'libs/underscore',
    jade: 'libs/runtime',
    'socket.io': 'libs/socket.io'
  }
});

// Add `mapValues` to underscore.
// https://github.com/jashkenas/underscore/issues/220
require(['underscore'], function(_) {
  _.mixin({ mapValues: function (obj, f_val) {
    return _.object(_.keys(obj), _.map(obj, f_val));
  }});
});

require(['promise'], function(Promise) {
  Promise.polyfill();
});

if (document.documentElement.style.objectFit !== undefined) {
  document.documentElement.classList.add('objectfit');
}

define('socket', ['socket.io'], function(io) {
  var socket = io({
    transports: ['websocket'],
    // transports: ['polling'],
    autoConnect: true
  });

  // socket.open();

  return socket;
});
