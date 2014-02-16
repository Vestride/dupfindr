
define(function(require) {
  var $ = require('jquery'),
      Mustache = require('libs/mustache'),
      Utilities = require('utilities');


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
      var delay = Utilities.getStoredArtistDuplicates( artist.name ) === null ?
          150 * i : 0;
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
      console.log(data);
      this.displayDuplicatesForArtist( artist, data.duplicates );
    }.bind(this)).fail(function(data, status, statusText) {
      console.log('getting ' + artist + ' failed: ' + status + ' - ' + statusText);
    });
  };


  new ArtistLoader();
});
