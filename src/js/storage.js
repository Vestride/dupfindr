
define(function(require) {
  var Storage = {};

  Storage.getArtistDuplicates = function( artist, parse ) {
    var dups = window.sessionStorage.getItem( artist );
    if ( dups && parse ) {
      dups = JSON.parse( dups );
    }
    return dups;
  };


  Storage.setArtistDuplicates = function( artist, duplicates ) {
    if ( artist !== undefined ) {
      window.sessionStorage.setItem(artist, JSON.stringify( duplicates ));
    }
  };


  Storage.getTopArtists = function(page) {
    var top = window.sessionStorage.getItem('topartists');
    if ( top === null ) {
      return top;
    }

    top = JSON.parse( top );

    if ( $.isNumeric( page ) ) {
      top = top.splice(page * 12, 12);
      if ( top.length === 0 ) {
        top = null;
      }
    }

    return top;
  };


  Storage.setTopArtists = function( artists, overwrite ) {
    var array;
    if ( overwrite ) {
      array = artists;
    } else {
      var top = Storage.getTopArtists() || [];
      array = top.concat(artists);
    }
    window.sessionStorage.setItem('topartists', JSON.stringify( array ));
  };

  return Storage;
});
