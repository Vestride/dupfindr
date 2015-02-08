define(function(require) {
  var $ = require('jquery');
  var Utilities = require('utilities');
  var Storage = require('storage');
  var artistCardTemplate = require('templates/artist-card');

  var Strings = {
    DUPLICATES: 'duplicates',
    DUPLICATE: 'duplicate'
  };

  var ArtistLoader = function() {
    this.topArtistPage = 0;
    this.isLoadingArtists = false;
    this.init();
  };


  ArtistLoader.prototype.init = function() {
    this.getTopArtists();
    this.listen();
  };


  ArtistLoader.prototype.listen = function() {
    $('.js-load-more').on('click', function(evt) {
      if (this.isLoadingArtists) {
        return;
      }

      var buttonEl = evt.currentTarget;

      this.topArtistPage++;

      Utilities.disableButton(buttonEl);
      this.getTopArtists(function() {
        Utilities.enableButton(buttonEl);
      });
    }.bind(this));
  };


  ArtistLoader.prototype.getTopArtists = function(cb) {
    var wait = Utilities.requestTopArtists(this.topArtistPage);

    this.isLoadingArtists = true;

    // Success
    wait.done(function(data) {
      this.populateArtists(data.artists);
      this.preloadDuplicates(data.artists);

      // Failure
    }.bind(this)).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse(jqXHR.responseText || '""');
      console.log('getting top artists failed - ' + statusText + ' - ' + data.message);

      // Always
    }).always(function() {
      this.isLoadingArtists = false;
      if (cb) {
        cb.call(this);
      }
    }.bind(this));
  };

  ArtistLoader.prototype.populateArtists = function(data) {
    console.log('populate artists with:', data);
    var html = artistCardTemplate(data);
    $('#artist-cards').append(html);
    $('#top-artists-loader').addClass(Utilities.ClassName.HIDDEN);
    $('#top-artists-load-more').removeClass(Utilities.ClassName.HIDDEN);
  };


  ArtistLoader.prototype.preloadDuplicates = function(data) {
    data.forEach(function(artist, i) {

      // If the data needs to be requested, throttle the requests to Last.fm.
      var delay = Storage.getArtistDuplicates(artist.name) === null ?
        175 * i : 0;

      // Show request is pending.
      this.getArtistCard(artist.name).addClass('artist-card--loading');

      setTimeout(function() {
        this.getArtistDuplicates(artist.name);
      }.bind(this), delay);
    }, this);
  };


  ArtistLoader.prototype.displayDuplicatesForArtist = function(artist, duplicates) {
    if (!duplicates) {
      return;
    }

    var $card = this.getArtistCard(artist);
    $card.removeClass('artist-card--loading');
    var $dups = $card.find('.artist-card__duplicates');
    var textSuffix = duplicates.length === 1 ?
      Strings.DUPLICATE :
      Strings.DUPLICATES;

    $dups.removeClass(Utilities.ClassName.HIDDEN);
    if (duplicates.length === 0) {
      $dups.addClass('no-duplicates');
    }
    $dups.text(duplicates.length + ' ' + textSuffix);
    $card.attr('data-duplicates', duplicates.length);
  };


  ArtistLoader.prototype.getArtistDuplicates = function(artist) {
    var wait = Utilities.requestArtistDuplicates(artist);

    wait.done(function(data) {
      this.displayDuplicatesForArtist(artist, data.duplicates);
    }.bind(this)).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse(jqXHR.responseText || '""');
      console.log('getting ' + artist + ' failed - ' + statusText + ' - ' + data.message);
    });
  };

  ArtistLoader.prototype.getArtistCard = function(artist) {
    return $('.artist-card[data-artist="' + artist + '"]');
  };


  new ArtistLoader();
});
