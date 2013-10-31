
// lastfm.js

/**
 * @fileoverview Things that deal with the Last.fm API.
 */

var common = require('./common');
var crypto = require('crypto');
var _ = require('underscore');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}


exports.getApiSignature = function(params, userAuthToken) {
  // Break the reference.
  params = _.clone(params);

  // Cannot have `format` nor `callback` in the parameters.
  if ( params.format ) {
    delete params.format;
  }
  if ( params.callback ) {
    delete params.callback;
  }

  // Add api key.
  params.api_key = common.API_KEY;

  // Is the user auth token optional for everything but the first call?
  if ( userAuthToken ) {
    params.token = userAuthToken;
  }

  // Alphabetically sort keys.
  var keys = [];
  for ( var key in params ) {
    keys.push(key);
  }
  keys.sort();

  // Create concatenated string of <name><value>.
  var paramsList = _.reduce(keys, function(memo, key) {
    return memo + key + params[ key ];
  }, '');

  var signature = paramsList + common.SECRET;

  console.log('params list:', paramsList);
  console.log('signature: ' + signature);

  return md5(signature);

  /*
  var params = [
    'api_key' + common.API_KEY,
    'method' + method,
    'token' + userAuthToken
  ];

  var signature = params.sort().join('') + common.SECRET;
  */
};


exports.getSignedCall = function(params, sessionKey, userAuthToken) {
  var signature = exports.getApiSignature( params, userAuthToken );

  var url = common.BASE_URL + 'api_sig=' + signature + '&api_key=' + common.API_KEY;

  // add format = json

  if ( userAuthToken ) {
    url += '&token=' + userAuthToken;
  }

  if ( sessionKey ) {
    url += '&sk=' + sessionKey;
  }

  if ( params ) {
    for ( var key in params ) {
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
  var msg = xmljs.lfm.error._.trim();

  if ( method ) {
    msg += '. Method was: ' + method;
  }

  return {
    code: xmljs.lfm.error.$.code,
    msg: msg
  };
};


// exports.removeScrobble = function(artist, track, timestamp, sessionKey) {

// };

