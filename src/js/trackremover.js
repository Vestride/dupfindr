

define(function(require) {
  var $ = require('jquery');
  var Utilities = require('utilities');
  var Settings = require('settings');

  var TrackRemover = function( element ) {
    this.$el = $(element);
    this.$count = this.$el.find('.js-duplicate-count');
    this.duplicateCount = parseInt( this.$count.text(), 10 );
    this.listen();
  };

  TrackRemover.prototype.listen = function() {
    this.$el.on('click', '.js-remove', $.proxy( this.handleRemoveTrack, this ));
    this.$el.on('click', '.js-remove-all', $.proxy( this.removeAllScrobbles, this ));
    $(this).on('trackremoved', $.proxy( this.handleTrackRemoved, this ));
  };


  TrackRemover.prototype.handleRemoveTrack = function(evt) {
    this.removeScrobble(evt.target);
  };


  TrackRemover.prototype.handleTrackRemoved = function(evt, trackData) {
    this.decrementCounter();

    if ( this.duplicateCount > 0 ) {
      var removedTimestamp = parseInt(trackData.timestamp, 10);
      var storedDuplicates = Utilities.getStoredArtistDuplicates(trackData.artist, true);
      var timestamps = storedDuplicates.map(function(obj) {
        return parseInt( obj.date.uts, 10 );
      });

      var index = timestamps.indexOf( removedTimestamp );

      if ( index !== -1 ) {
        storedDuplicates.splice( index, 1 );
      }

      Utilities.storeArtistDuplicates( trackData.artist, storedDuplicates );

      return;
    }
    var $zeroMessage = this.$el.find('.js-none-left'),
        $siblings = $zeroMessage.siblings();

    $siblings.addClass('hidden');
    $zeroMessage.removeClass('hidden');
  };


  TrackRemover.prototype.removeScrobble = function(buttonEl) {
    var trackData = buttonEl.dataset;

    if ( trackData.isLoading === "true" ) {
      console.log('hey i\'m still doing stuff here.');
      return;
    }

    this.showLoadingState( buttonEl );

    var self = this;
    return $.ajax({
      url: 'remove-track',
      type: 'post',
      data: trackData,
      dataType: 'json'
    }).done(function( data ) {
      console.log(data);
      self.removeRow( $(buttonEl).closest('li') );
      $(self).trigger('trackremoved', [trackData]);
    }).fail(function(data, status, statusText) {
      console.log('remove track failed: ' + status + ' - ' + statusText);
    }).always(function() {
      self.hideLoadingState( buttonEl );
    });


    // Testing deferreds.
    // var self = this;
    // var dfd = new $.Deferred();
    // dfd.done(function() {
    //   self.removeRow( $(buttonEl).closest('li') );
    //   $(self).trigger('trackremoved');
    // }).fail(function(data, status, statusText) {
    //   console.log('remove track failed: ' + status + ' - ' + statusText);
    // }).always(function() {
    //   self.hideLoadingState( buttonEl );
    // });

    // setTimeout(function() {
    //   dfd.resolve();
    // }, Math.random() * 500);

    // return dfd;
  };


  TrackRemover.prototype.removeAllScrobbles = function(evt) {
    var self = this;
    var removeAllEl = evt.target;
    var promises = [];
    this.$el.find('li:not(.remove-item) .js-remove').each(function(i) {
      var buttonEl = this;

      // Last.fm's terms say no more than 5 requests per second.
      // Try to abide by that.
      setTimeout(function() {
        promises.push( self.removeScrobble(buttonEl) );
      }, 150 * i);
    });

    $(removeAllEl)
        .removeClass('in')
        .one(Settings.transitionend, function() {
          $(removeAllEl).remove();
        });
  };


  TrackRemover.prototype.removeRow = function( $row ) {
    $row.addClass('remove-item');
    // Don't remove it from the DOM because that will change the nth-child styling.
  };


  TrackRemover.prototype.decrementCounter = function() {
    this.duplicateCount--;
    this.$count.text( this.duplicateCount );
  };


  TrackRemover.prototype.hideLoadingState = function( button ) {
    button.dataset.isLoading = false;
    button.textContent = button.dataset.restingText;
    button.disabled = false;
  };


  TrackRemover.prototype.showLoadingState = function( button ) {
    var currentText = button.textContent;

    // Write on the next frame.
    requestAnimationFrame(function() {
      button.dataset.restingText = currentText;
      button.dataset.isLoading = true;
      button.textContent = 'Loading...';
      button.disabled = true;
    });
  };

  return TrackRemover;
});

