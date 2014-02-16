
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
    var top = Storage.getTopArtists(0);
    if ( top && top.length > 0 ) {
      this.populateArtists(top);
      this.preloadDuplicates(top);
      return;
    }

    var jqXhr = $.ajax({
      url: '/topartists',
      type: 'get',
      data: {},
      dataType: 'json'
    });

    jqXhr.done(function( data ) {
      this.populateArtists(data.artists);
      Storage.setTopArtists(data.artists);
      this.preloadDuplicates(data.artists);
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
      var delay = Storage.getArtistDuplicates( artist.name ) === null ?
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
      this.displayDuplicatesForArtist( artist, data.duplicates );
    }.bind(this)).fail(function(data, status, statusText) {
      var data = JSON.parse( jqXHR.responseText );
      console.log(data);
      console.log('getting ' + artist + ' failed: ' + status + ' - ' + statusText);
    });
  };


  new ArtistLoader();
});
