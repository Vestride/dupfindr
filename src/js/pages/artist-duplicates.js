
define(function(require) {
  var $ = require('jquery');
  var Utilities = require('utilities');
  var TrackRemover = require('trackremover');
  var tableTemplate = require('templates/track-remover-table');

  var $loadingMsg = $('.list-loading-msg');
  var artist = $loadingMsg.data('artist');

  function showContent(data, textStatus, jqXHR) {
    // This should always be an array. If it's not, show an error message.
    if ( !data || !data.duplicates ) {
      showError(jqXHR);
      return;
    }

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

  function showError(jqXHR) {
    var data = JSON.parse( jqXHR.responseText || '""' );
    $loadingMsg.find('.loading-title').text(data.generic);
    $loadingMsg.find('.error-placeholder').text(data.message);
    $loadingMsg.find('.duplicates-loader').addClass(Utilities.ClassName.HIDDEN);
  }

  var wait = Utilities.requestArtistDuplicates( artist );
  wait.done(showContent);
  wait.fail(showError);
});
