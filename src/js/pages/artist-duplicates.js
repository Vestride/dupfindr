
define(function(require) {
  var $ = require('jquery');
  var Utilities = require('utilities');
  var TrackRemover = require('trackremover');
  var tableTemplate = require('templates/track-remover-table');

  var $loadingMsg = $('.list-loading-msg');
  var artist = $loadingMsg.data('artist');

  function showContent(duplicates) {
    var hasDuplicates = duplicates.length > 0;
    var selector = hasDuplicates ? '.list-duplicates' : '.no-duplicates';

    $(selector).removeClass( Utilities.ClassName.HIDDEN );

    if ( hasDuplicates ) {
      var html = tableTemplate({
        duplicates: duplicates
      });
      var $trackRemover = $('.js-track-remover');
      $trackRemover.html( html );
      new TrackRemover( $trackRemover[0] );
    }

    $loadingMsg.addClass( Utilities.ClassName.HIDDEN );
    $loadingMsg = null;
  }

  function showError(error) {
    $loadingMsg.find('.loading-title').text(error.generic);
    $loadingMsg.find('.error-placeholder').text(error.message);
    $loadingMsg.find('.duplicates-loader').addClass(Utilities.ClassName.HIDDEN);
  }

  Utilities.requestArtistDuplicates( artist )
    .then(showContent)
    .catch(showError);
});
