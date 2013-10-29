
// lastfm.js

/**
 * @fileoverview Things that deal with the Last.fm API.
 */

var common = require('./common');
var crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}


exports.getSignature = function(userAuthToken, method, sessionKey) {

  var params = [
    'api_key' + common.API_KEY,
    'method' + method,
    'token' + userAuthToken
  ];

  if ( sessionKey ) {
    params.push('&sk=' + sessionKey);
  }

  var signature = params.sort().join('') + common.SECRET;

  console.log('signature: ' + signature);

  return md5(signature);
};


exports.getSignedCall = function(signature, sessionKey, params, userAuthToken) {

  if ( !signature ) {
    console.log('no signature, grabbing it...');

    // Should this be stored in a cookie/localStorage?
    // It uses the user token, but then the user token isn't needed again, yet this is.
    // Docs also say to save the session key to db.
    signature = exports.getSignature( userAuthToken, params.method, sessionKey );
  }

  var url = common.BASE_URL + 'api_sig=' + signature + '&api_key=' + common.API_KEY;

  if ( userAuthToken ) {
    url += '&token=' + userAuthToken;
  }

  if ( sessionKey ) {
    url += '&sk=' + sessionKey;
  }

  if ( params ) {
    for (var key in params ) {
      url += '&' + key + '=' + encodeURIComponent( params[ key ] );
    }
  }

  return url;
};


exports.getCall = function(params) {
  var url = common.BASE_URL + 'api_key=' + common.API_KEY;

  if ( params ) {
    for (var key in params ) {
      url += '&' + key + '=' + encodeURIComponent( params[ key ] );
    }
  }

  return url;
};


/**
 * Returns an object representing the error from last fm.
 * @param {Object} xmljs XML which has been parsed into a js object.
 * @param {stromg} [method] Optional method which was used in the API call.
 * @return {Object} Response object.
 */
exports.getError = function(xmljs, method) {
  var msg = xmljs.lfm.error[0]._.trim();

  if ( method ) {
    msg += '. Method was: ' + method;
  }

  return {
    code: xmljs.lfm.error[0].$.code,
    msg: msg
  };
};


// exports.removeScrobble = function(artist, track, timestamp, sessionKey) {

// };

