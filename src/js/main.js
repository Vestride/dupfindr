
requirejs.config({
  baseUrl: 'js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
    // 'socket.io': '//localhost:8080/socket.io/socket.io'
  }
});



define(function(require) {
  var $ = require('jquery'),
      TrackRemover = require('trackremover');
      // io = require('socket.io');

  // var socket = io.connect('http://localhost:8080');
  // socket.on('news', function (data) {
  //   console.log(data);
  //   socket.emit('sup', { my: 'data' });
  // });

  var $trackRemover = $('.js-track-remover');

  if ( $trackRemover.length ) {
    var tr = new TrackRemover( $trackRemover[0]);
  }
});

