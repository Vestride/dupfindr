
// lastfm.js

/**
 * @fileOverview Things that deal with the Last.fm API.
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


exports.getSignedCall = function(userAuthToken, signature, sessionKey, params) {
  var base = common.BASE_URL + 'api_sig=' + signature + '&api_key=' + common.API_KEY + '&token=' + userAuthToken;

  if ( sessionKey ) {
    base += '&sk=' + sessionKey;
  }

  if ( params ) {
    for (var key in params ) {
      base += '&' + key + '=' + params[ key ];
    }
  }

  return base;
};



/**
 * Returns an object representing the error from last fm.
 * @param {Object} xmljs XML which has been parsed into a js object.
 * @return {Object} Response object.
 */
exports.getError = function(xmljs) {
  return {
    code: xmljs.lfm.error[0].$.code,
    msg: xmljs.lfm.error[0]._.trim()
  };
};

