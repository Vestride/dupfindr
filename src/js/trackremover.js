

define(['jquery'], function($) {

  var transitionend = (function() {
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


  TrackRemover.prototype.handleTrackRemoved = function() {
    if ( this.duplicateCount > 0 ) {
      return;
    }
    var $zeroMessage = this.$el.find('.js-none-left'),
        $siblings = $zeroMessage.siblings();

    $siblings.addClass('hidden');
    $zeroMessage.removeClass('hidden');

  };


  TrackRemover.prototype.removeScrobble = function(buttonEl) {
    var data = buttonEl.dataset;

    if ( data.isLoading === "true" ) {
      console.log('hey i\'m still doing stuff here.');
      return;
    }

    this.showLoadingState( buttonEl );

    var self = this;
    return $.ajax({
      url: 'remove-track',
      type: 'post',
      data: data,
      dataType: 'json'
    }).done(function( data ) {
      console.log(data);
      self.removeRow( $(buttonEl).closest('li') );
      $(self).trigger('trackremoved');
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
        .one(transitionend, function() {
          $(removeAllEl).remove();
        });
  };


  TrackRemover.prototype.removeRow = function( $row ) {
    this.decrementCounter();
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
