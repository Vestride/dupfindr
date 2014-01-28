

define(['jquery'], function($) {
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

    this.showLoadingState( buttonEl );

    var self = this;
    $.ajax({
      url: 'remove-track',
      type: 'post',
      data: data,
      dataType: 'json'
    }).done(function( data ) {
      console.log(data);
      $(self).trigger('trackremoved');
      self.removeRow( $(buttonEl).closest('tr') );
    }).fail(function(data, status, statusText) {
      console.log('remove track failed: ' + status + ' - ' + statusText);
    }).always(function() {
      self.hideLoadingState( buttonEl );
    });
    // socket.emit('removeScrobble', data);
  };


  // TODO(glen): Make much cooler.
  TrackRemover.prototype.removeRow = function( $row ) {
    // TODO(glen): Update badge with duplicate count.
    $row.remove();
  };


  TrackRemover.prototype.hideLoadingState = function( button ) {
    button.textContent = button.dataset.restingText;
    button.disabled = false;
  };


  TrackRemover.prototype.showLoadingState = function( button ) {
    var currentText = button.textContent;
    button.dataset.restingText = currentText;
    button.textContent = 'Loading...';
    button.disabled = true;
  };

  return TrackRemover;
});

