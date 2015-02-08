define(function(require) {
  var $ = require('jquery');
  var Utilities = require('utilities');
  var Storage = require('storage');
  var artistCardTemplate = require('templates/artist-card');
  var topArtistErrorTemplate = require('templates/top-artists-error');

  var Strings = {
    DUPLICATES: 'duplicates',
    DUPLICATE: 'duplicate'
  };

  var ArtistLoader = function() {
    this.isLoadingArtists = false;
    this.init();
  };


  ArtistLoader.prototype.init = function() {
    var numStoredArtists = Storage.getTopArtists();
    if (numStoredArtists === null) {
      this.topArtistPage = 0;
    } else {
      this.topArtistPage = numStoredArtists.length / 12;
    }
    this.getTopArtists(null);
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
      this.getTopArtists(this.topArtistPage, function() {
        Utilities.enableButton(buttonEl);
      });
    }.bind(this));

    $('#artist-cards').on('click', '.artist-card__error', function(e) {
      e.preventDefault();
      window.alert(e.currentTarget.getAttribute('title'));
    });
  };


  ArtistLoader.prototype.getTopArtists = function(page, cb) {
    var request = Utilities.requestTopArtists(page);

    this.isLoadingArtists = true;

    // Success
    request.then(function(artists) {
      this.populateArtists(artists);
      this.preloadDuplicates(artists);

      // Failure
    }.bind(this)).catch(function(err) {
      this.showTopArtistsFailure(err.message || err.generic);

      // Always
    }.bind(this)).then(function() {
      this.isLoadingArtists = false;
      if (cb) {
        cb.call(this);
      }
    }.bind(this));
  };

  /**
   * Get the template string and append it to the artists container.
   * @param {Array.<Object>} data An array of artist objects.
   */
  ArtistLoader.prototype.populateArtists = function(data) {
    $('#artist-cards').append(artistCardTemplate(data));
    $('#top-artists-loader').addClass(Utilities.ClassName.HIDDEN);
    $('#top-artists-load-more').removeClass(Utilities.ClassName.HIDDEN);
  };

  /**
   * Show the user something went wrong.
   * @param {string} message An error message.
   */
  ArtistLoader.prototype.showTopArtistsFailure = function(message) {
    $('#artist-cards').prepend(topArtistErrorTemplate({
      message: message
    }));
    $('#top-artists-loader').addClass(Utilities.ClassName.HIDDEN);
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


  /**
   * Update the artist card template with new data for the number of duplicates.
   * @param {string} artist Artist name.
   * @param {Array} duplicates Array of dups.
   */
  ArtistLoader.prototype.displayDuplicatesForArtist = function(artist, duplicates) {
    if (!duplicates) {
      return;
    }

    var $card = this.getArtistCard(artist);
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

  ArtistLoader.prototype.displayArtistLoadFailure = function(artist, obj) {
    var message = obj.message || obj.generic;
    var $card = this.getArtistCard(artist);
    $card.find('.artist-card__error').attr('title', message).removeClass(Utilities.ClassName.HIDDEN);
  };


  ArtistLoader.prototype.getArtistDuplicates = function(artist) {
    var wait = Utilities.requestArtistDuplicates(artist);

    wait.done(function(data) {
      this.displayDuplicatesForArtist(artist, data.duplicates);
    }.bind(this)).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse(jqXHR.responseText || '""');
      console.error('getting ' + artist + ' failed - ' + statusText + ' - ' + data.message);
      this.displayArtistLoadFailure(artist, data);
    }.bind(this)).always(function() {
      this.getArtistCard(artist).removeClass('artist-card--loading');
    }.bind(this));
  };

  /**
   * Retrieve the artist card element.
   * @param {string} artist Name of the artist.
   * @return {jQuery}
   */
  ArtistLoader.prototype.getArtistCard = function(artist) {
    return $('.artist-card[data-artist="' + artist + '"]');
  };


  new ArtistLoader();
});
