

define(function(require) {
  var $ = require('jquery');
  var _ = require('underscore');
  var Utilities = require('utilities');
  var Settings = require('settings');
  var Storage = require('storage');

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
    this.removeScrobble(evt.currentTarget);
  };


  TrackRemover.prototype.handleTrackRemoved = function(evt, trackData) {
    var removedTimestamp = parseInt(trackData.timestamp, 10);
    var storedDuplicates = Storage.getArtistDuplicates(trackData.artist, true);
    var timestamps = storedDuplicates.map(function(obj) {
      return parseInt( obj.date.uts, 10 );
    });

    var index = timestamps.indexOf( removedTimestamp );

    if ( index !== -1 ) {
      storedDuplicates.splice( index, 1 );
    }

    Storage.setArtistDuplicates( trackData.artist, storedDuplicates );

    this.decrementCounter();

    if ( this.duplicateCount === 0 ) {
      var $zeroMessage = this.$el.find('.js-none-left'),
          $siblings = $zeroMessage.siblings();

      $siblings.addClass('hidden');
      $zeroMessage.removeClass('hidden');
    }
  };


  TrackRemover.prototype.removeScrobble = function(buttonEl) {
    var trackData = _.clone(buttonEl.dataset);

    if ( trackData.isLoading === 'true' ) {
      console.log('hey i\'m still doing stuff here.');
      return;
    }

    if ( !trackData.artist || !trackData.timestamp || !trackData.track ) {
      console.log('Missing data', trackData);
      return;
    }

    this.showLoadingState( buttonEl );

    // Build query string.
    var s = [];
    _.each(trackData, function(value, key) {
      s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
    });

    var _this = this;
    return fetch('/remove-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: s.join('&').replace(/%20/g, '+')
    })
    .then(Utilities.status)
    .then(function( data ) {
      console.log(data);
      _this.removeRow( $(buttonEl).closest('li') );
      $(_this).trigger('trackremoved', [trackData]);
    }).catch(function(err) {
      console.error('remove track failed - ' + err.message);
    }).then(function() {
      _this.hideLoadingState( buttonEl );
    });
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
    Utilities.enableButton( button );
  };


  TrackRemover.prototype.showLoadingState = function( button ) {
    Utilities.disableButton( button );
  };

  return TrackRemover;
});

