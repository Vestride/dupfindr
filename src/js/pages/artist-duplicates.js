
define(function(require) {
  var $ = require('jquery');
  var Mustache = require('libs/mustache');
  var Utilities = require('utilities');
  var TrackRemover = require('trackremover');
  var Jade = require('libs/runtime');
  var tableTemplate = require('templates/track-remover-table');

  var $loadingMsg = $('.list-loading-msg');
  var artist = $loadingMsg.data('artist');

  function showContent(data) {
    var dups = data.duplicates;
    var hasDuplicates = dups.length > 0;
    var selector = hasDuplicates ? '.list-duplicates' : '.no-duplicates';

    $(selector).removeClass( Utilities.ClassName.HIDDEN );

    if ( hasDuplicates ) {
      var html = tableTemplate(data);
      var $trackRemover = $('.js-track-remover');
      $trackRemover.html( html );
      new TrackRemover( $trackRemover[0] );
    }

    $loadingMsg.addClass( Utilities.ClassName.HIDDEN );
    $loadingMsg = null;
  }

  var wait = Utilities.requestArtistDuplicates( artist );
  wait.done(showContent);
});
