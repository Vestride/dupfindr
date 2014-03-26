

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

    var encodedData = _.mapValues(trackData, function(value) {
      return encodeURIComponent(value);
    });

    this.showLoadingState( buttonEl );

    var self = this;
    return $.ajax({
      url: 'remove-track',
      type: 'post',
      data: encodedData,
      dataType: 'json'
    }).done(function( data ) {
      console.log(data);
      self.removeRow( $(buttonEl).closest('li') );
      $(self).trigger('trackremoved', [trackData]);
    }).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse( jqXHR.responseText || '""' );
      console.log('remove track failed - ' + statusText + ' - ' + data.message);
    }).always(function() {
      self.hideLoadingState( buttonEl );
    });


    // Testing deferreds.
    // var self = this;
    // var dfd = new $.Deferred();
    // dfd.done(function() {
    //   self.removeRow( $(buttonEl).closest('li') );
    //   $(self).trigger('trackremoved', [trackData]);
    // }).fail(function(jqXHR, status, statusText) {
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
    Utilities.enableButton( button );
  };


  TrackRemover.prototype.showLoadingState = function( button ) {
    Utilities.disableButton( button );
  };

  return TrackRemover;
});

