
// lastfm.js

/**
 * @fileoverview Things that deal with the Last.fm API.
 */

var common = require('./common');
var crypto = require('crypto');
var _ = require('underscore');
var request = require('request');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// https://github.com/jammus/lastfm-node/blob/master/lib/lastfm/lastfm-request.js
var WRITE_METHODS = [
  'album.addtags', 'album.removetag', 'album.share',
  'artist.addtags', 'artist.removetag', 'artist.share', 'artist.shout',
  'event.attend', 'event.share', 'event.shout',
  'library.addalbum', 'library.addartist', 'library.addtrack',
  'library.removealbum', 'library.removeartist', 'library.removetrack', 'library.removescrobble',
  'playlist.addtrack', 'playlist.create',
  'radio.tune',
  'track.addtags', 'track.ban', 'track.love', 'track.removetag',
  'track.scrobble', 'track.share', 'track.unban', 'track.unlove',
  'track.updatenowplaying',
  'user.shout'
];
var SIGNED_METHODS = [
  'auth.getmobilesession', 'auth.getsession', 'auth.gettoken',
  'radio.getplaylist',
  'user.getrecentstations', 'user.getrecommendedartists', 'user.getrecommendedevents'
];


function isWriteMethod( method ) {
  return WRITE_METHODS.indexOf( method ) > -1;
}

function isSignedMethod( method ) {
  return SIGNED_METHODS.indexOf( method ) > -1;
}

function requiresSignature( method ) {
  return isWriteMethod( method ) || isSignedMethod(method);
}



exports.request = function(params, fn) {
  var httpVerb = 'get';
  var firstParam;
  var requestParams = exports.getCall( params );

  // Posting has to be done as a js object.
  if ( isWriteMethod( params.method ) ) {
    httpVerb = 'post';

    firstParam = {
      uri: common.BASE_URL,
      form: requestParams
    };

  // Create query string.
  } else {
    firstParam = common.BASE_URL + '?';
    for ( var key in requestParams ) {
      firstParam += '&' + key + '=' + encodeURIComponent( params[ key ] );
    }
  }

  console.log(httpVerb.toUpperCase() + ': ', firstParam);

  request[httpVerb](firstParam, function(err, response, body) {
    var resp = body.length > 200 ? body.substring(0, 200) + '| truncated' : body;
    console.log('last.fm response:', resp);

    if ( err ) {
      console.log('request error:', err);
    }

    // Parse JSON from Last.fm
    var result = {};
    try {
      result = JSON.parse(body);
    } catch(e) {
      console.log('Unable to parse last.fm\'s response:', resp);
    }

    var error = result.error ? result.error : null;

    fn(error, result);
  });
};


exports.getApiSignature = function(params) {
  // Break the reference.
  params = _.clone(params);

  // Cannot have `format` nor `callback` in the parameters.
  if ( params.format ) {
    delete params.format;
  }
  if ( params.callback ) {
    delete params.callback;
  }

  // Alphabetically sort keys.
  var keys = Object.keys(params).sort();

  // Create concatenated string of <name><value>.
  var paramsList = _.reduce(keys, function(memo, key) {
    return memo + key + params[ key ];
  }, '');

  // Append secret to the request rul.
  var signature = paramsList + common.SECRET;

  console.log('params list:', paramsList);

  // Hash it and return.
  return md5(signature);
};


exports.getCall = function( params ) {
  params.api_key = common.API_KEY;

  if ( requiresSignature( params.method ) ) {
    params.api_sig = exports.getApiSignature( params );
  }

  // TODO: session key here or in the request?

  params.format = 'json';

  return params;
};

exports.Errors = {
  '1' : 'This error does not exist',
  '2' : 'Invalid service - This service does not exist',
  '3' : 'Invalid Method - No method with that name in this package',
  '4' : 'Authentication Failed - You do not have permissions to access the service',
  '5' : 'Invalid format - This service doesn\'t exist in that format',
  '6' : 'Invalid parameters - Your request is missing a required parameter',
  '7' : 'Invalid resource specified',
  '8' : 'Operation failed - Most likely the backend service failed. Please try again.',
  '9' : 'Invalid session key - Please re-authenticate',
  '10' : 'Invalid API key - You must be granted a valid key by last.fm',
  '11' : 'Service Offline - This service is temporarily offline. Try again later.',
  '12' : 'Subscribers Only - This station is only available to paid last.fm subscribers',
  '13' : 'Invalid method signature supplied',
  '14' : 'Unauthorized Token - This token has not been authorized',
  '15' : 'This item is not available for streaming.',
  '16' : 'The service is temporarily unavailable, please try again.',
  '17' : 'Login: User requires to be logged in',
  '18' : 'Trial Expired - This user has no free radio plays left. Subscription required.',
  '19' : 'This error does not exist',
  '20' : 'Not Enough Content - There is not enough content to play this station',
  '21' : 'Not Enough Members - This group does not have enough members for radio',
  '22' : 'Not Enough Fans - This artist does not have enough fans for for radio',
  '23' : 'Not Enough Neighbours - There are not enough neighbours for radio',
  '24' : 'No Peak Radio - This user is not allowed to listen to radio during peak usage',
  '25' : 'Radio Not Found - Radio station not found',
  '26' : 'API Key Suspended - This application is not allowed to make requests to the web services',
  '27' : 'Deprecated - This type of request is no longer supported',
  '29' : 'Rate Limit Exceded - Your IP has made too many requests in a short period, exceeding our API guidelines'
};


exports.getHttpErrorCode = function( errorCode ) {
  if ( _.isUndefined(errorCode) || _.isNull(errorCode) ) {
    return 200;
  }

  errorCode = parseInt( errorCode, 10 );
  var httpCode;

  // TODO(glen): Add more as I figure out which code is whose fault.
  switch (errorCode) {
    // Bad Request
    case 5:
    case 13:
      httpCode = 400;
      break;

    // Service unavailable.
    case 8:
      httpCode = 503;
      break;
    default:
      httpCode = 400;
  }

  return httpCode;
};

