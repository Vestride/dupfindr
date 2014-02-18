
define(function(require) {
  var $ = require('jquery'),
      Mustache = require('libs/mustache'),
      Utilities = require('utilities'),
      Storage = require('storage');


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
    var wait = Utilities.requestTopArtists(0);

    wait.done(function(data) {
      this.populateArtists(data.artists);
      this.preloadDuplicates(data.artists);
    }.bind(this)).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse( jqXHR.responseText || '""' );
      console.log('getting top artists failed - ' + statusText + ' - ' + data.message);
    });
  };

  ArtistLoader.prototype.populateArtists = function( data ) {
    var output = Mustache.render(artistCardTempalate, {
      artists: data
    });
    $('#artist-cards').append( output );
    $('#top-artists-loader').addClass( Utilities.ClassName.HIDDEN );
  };


  ArtistLoader.prototype.preloadDuplicates = function( data ) {
    data.forEach(function(artist, i) {
      var delay = Storage.getArtistDuplicates( artist.name ) === null ?
          175 * i : 0;
      setTimeout(function() {
        this.getArtistDuplicates( artist.name );
      }.bind(this), delay);
    }, this);
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

    $dups.removeClass( Utilities.ClassName.HIDDEN );
    $dups.text( numDuplicates + ' ' + textSuffix );
  };


  ArtistLoader.prototype.getArtistDuplicates = function( artist ) {
    var wait = Utilities.requestArtistDuplicates( artist );

    wait.done(function(data) {
      this.displayDuplicatesForArtist( artist, data.duplicates );
    }.bind(this)).fail(function(jqXHR, status, statusText) {
      var data = jqXHR.responseJSON || JSON.parse( jqXHR.responseText || '""' );
      console.log('getting ' + artist + ' failed - ' + statusText + ' - ' + data.message);
    });
  };


  new ArtistLoader();
});
