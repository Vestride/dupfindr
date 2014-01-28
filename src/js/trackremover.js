

define(['jquery'], function($, io) {
  // var socket = io.connect('http://localhost:8080');
  // socket.on('news', function (data) {
  //   console.log(data);
  //   socket.emit('sup', { my: 'data' });
  // });

  var TrackRemover = function( element ) {
    this.$element = $(element);
    this._addListeners();
  };

  TrackRemover.prototype._addListeners = function() {
    this.$element.on('click', '.js-remove', $.proxy( this.removeScrobble, this ));
  };

  TrackRemover.prototype.removeScrobble = function(evt) {
    var buttonEl = evt.target;
    var data = buttonEl.dataset;

    console.log(data);
    // socket.emit('removeScrobble', data);
  };

  return TrackRemover;
});

