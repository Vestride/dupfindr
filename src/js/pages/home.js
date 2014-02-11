
define(function(require) {
  var $ = require('jquery'),
      Mustache = require('libs/mustache');


  var artistCardTempalate = $('#mustache__artist-card').html().trim();

  var Strings = {
    DUPLICATES: 'duplicates',
    DUPLICATE: 'duplicate'
  };

  var ArtistLoader = function() {
    this.init();
  };


  ArtistLoader.prototype.init = function() {
    this.getTopArtists();
  };


  ArtistLoader.prototype.getTopArtists = function() {
    var jqXhr = $.ajax({
      url: '/topartists',
      type: 'get',
      data: {},
      dataType: 'json'
    });

    jqXhr.done(function( data ) {
      this.populateArtists(data);
      this.preloadDuplicates(data);
    }.bind(this)).fail(function(data, status, statusText) {
      console.log('getting top artists failed: ' + status + ' - ' + statusText);
    });
  };

  ArtistLoader.prototype.populateArtists = function( data ) {
    var output = Mustache.render(artistCardTempalate, {
      artists: data
    });
    $('#artist-cards').html( output );
  };


  ArtistLoader.prototype.preloadDuplicates = function( data ) {
    data.forEach(function(artist, i) {
      setTimeout(function() {
        this.getDuplicatesForArtist( artist.name );
      }.bind(this), 150 * i);
    }, this);
  };


  ArtistLoader.prototype.getDuplicatesForArtist = function(artist) {

    var duplicates = window.sessionStorage.getItem(artist);
    if ( duplicates !== null ) {
      duplicates = JSON.parse(duplicates);
      this.displayDuplicatesForArtist( artist, duplicates );
      return;
    }


    var xhr = $.ajax({
      url: '/artist-duplicates',
      type: 'get',
      data: {
        artist: encodeURIComponent(artist)
      },
      dataType: 'json'
    });

    xhr.done(function(data) {
      console.log(data);
      // Save to session storage.
      window.sessionStorage.setItem(artist, JSON.stringify( data.duplicates ));
      this.displayDuplicatesForArtist( artist, data.duplicates );
    }.bind(this)).fail(function(data, status, statusText) {
      console.log('getting ' + artist + ' failed: ' + status + ' - ' + statusText);
    });
  };


  ArtistLoader.prototype.displayDuplicatesForArtist = function(artist, duplicates) {
    var numDuplicates = duplicates.length;

    if ( numDuplicates === 0 ) {
      return;
    }

    var $dups = $('.artist-card[data-artist="' + artist + '"] .artist-card__duplicates');
    var textSuffix = numDuplicates === 1 ?
        Strings.DUPLICATE :
        Strings.DUPLICATES;

    $dups.removeClass('hidden');
    $dups.text( numDuplicates + ' ' + textSuffix );
  };


  new ArtistLoader();
});
