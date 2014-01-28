
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

  var $trackList = $('.duplicate-list');

  if ( $trackList.length ) {
    var tr = new TrackRemover( $trackList[0] );
  }
});

