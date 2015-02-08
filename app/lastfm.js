/**
 * @fileoverview Things that deal with the Last.fm API.
 */

var common = require('./common');
var _ = require('underscore');
var request = require('request');
var md5 = require('MD5');

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


function isWriteMethod(method) {
  return WRITE_METHODS.indexOf(method) > -1;
}

function isSignedMethod(method) {
  return SIGNED_METHODS.indexOf(method) > -1;
}

function requiresSignature(method) {
  return isWriteMethod(method) || isSignedMethod(method);
}



exports.request = function(params, fn) {
  var options = {
    uri: common.BASE_URL
  };
  var requestParams = exports.getCall(params);

  // Posting has to be done as a js object.
  if (isWriteMethod(params.method)) {
    options.method = 'post';
    options.form = requestParams;

    // Use query string.
  } else {
    options.method = 'get';
    options.qs = requestParams;
  }

  // console.log(options.method.toUpperCase() + ':', options);

  function callback(err, response, body) {
    var result = {};

    if (body) {
      var resp = body.length > 140 ? body.substring(0, 140).replace(/\n/g, '') + '...' : body;
      var copy = params.artist ?
        'last.fm response for [' + params.artist + ']' :
        'last.fm response:';
      console.log(copy, resp);

      // Parse JSON from Last.fm
      try {
        result = JSON.parse(body);
      } catch (e) {
        // See if there was a response code from last.fm (like 500 or 503)
        if (response && response.responseCode) {
          console.error(response.responseCode);
          result.error = response.responseCode;
        }

        // Last.fm sometimes returns xml even when format=json, and incomplete xml at that!
        if (/<\?xml/.test(body)) {
          result.error = 'received_xml';
        } else {
          result.error = 'bad_json';
        }
      }
    } else {
      console.log('no last.fm response');
    }

    if (err) {
      console.log('request error:', err);
      result.error = err.code;
    }

    if (result.error) {
      result.message = exports.getErrorMessage(result.error);
      console.error(result.message);
      fn(result.error, result);

    } else {
      fn(null, result);
    }

  }

  request(options, callback);
};


exports.getApiSignature = function(params) {
  // Break the reference.
  // The parameters need to be encoded for the api signature...right?
  params = _.clone(params);

  // Cannot have `format` nor `callback` in the parameters.
  if (params.format) {
    delete params.format;
  }
  if (params.callback) {
    delete params.callback;
  }

  // Alphabetically sort keys.
  var keys = Object.keys(params).sort();

  // Create concatenated string of <name><value>.
  var paramsList = keys.reduce(function(memo, key) {
    return memo + key + params[key];
  }, '');

  // Append secret to the request rul.
  var signature = paramsList + common.SECRET;

  console.log('params list:', paramsList);

  // Hash it and return.
  return md5(signature);
};


// Don't encode parameters, request does that already. Been down that road :(
exports.getCall = function(params) {
  params.api_key = common.API_KEY;

  if (requiresSignature(params.method)) {
    params.api_sig = exports.getApiSignature(params);
  }

  params.format = 'json';

  return params;
};

exports.Errors = {
  '1': 'This error does not exist',
  '2': 'Invalid service - This service does not exist',
  '3': 'Invalid Method - No method with that name in this package',
  '4': 'Authentication Failed - You do not have permissions to access the service',
  '5': 'Invalid format - This service doesn\'t exist in that format',
  '6': 'Invalid parameters - Your request is missing a required parameter',
  '7': 'Invalid resource specified',
  '8': 'Operation failed - Most likely the backend service failed. Please try again.',
  '9': 'Invalid session key - Please re-authenticate',
  '10': 'Invalid API key - You must be granted a valid key by last.fm',
  '11': 'Service Offline - This service is temporarily offline. Try again later.',
  '12': 'Subscribers Only - This station is only available to paid last.fm subscribers',
  '13': 'Invalid method signature supplied',
  '14': 'Unauthorized Token - This token has not been authorized',
  '15': 'This item is not available for streaming.',
  '16': 'The service is temporarily unavailable, please try again.',
  '17': 'Login: User requires to be logged in',
  '18': 'Trial Expired - This user has no free radio plays left. Subscription required.',
  '19': 'This error does not exist',
  '20': 'Not Enough Content - There is not enough content to play this station',
  '21': 'Not Enough Members - This group does not have enough members for radio',
  '22': 'Not Enough Fans - This artist does not have enough fans for for radio',
  '23': 'Not Enough Neighbours - There are not enough neighbours for radio',
  '24': 'No Peak Radio - This user is not allowed to listen to radio during peak usage',
  '25': 'Radio Not Found - Radio station not found',
  '26': 'API Key Suspended - This application is not allowed to make requests to the web services',
  '27': 'Deprecated - This type of request is no longer supported',
  '29': 'Rate Limit Exceded - Your IP has made too many requests in a short period, exceeding our API guidelines',

  'received_xml': 'Last.fm replied with XML even though we requested JSON',
  'bad_json': 'Unable to parse last.fm\'s response.',

  'ECONNRESET': 'Connection to Last.fm hung up unexpectedly'
};

exports.getErrorMessage = function(key) {
  return exports.Errors[key] || '¯\_(ツ)_/¯';
};

exports.getHttpErrorCode = function(errorCode) {
  if (_.isUndefined(errorCode) || _.isNull(errorCode)) {
    return 200;
  }

  var httpCode;

  // TODO(glen): Add more as I figure out which code is whose fault.
  switch (errorCode) {
    // Bad Request
    case '5':
    case '13':
      httpCode = 400;
      break;

    // Unauthorized.
    case '401':
      httpCode = 401;
      break;

    // Not found.
    case '404':
      httpCode = 404;
      break;

    // Request timeout.
    case '408':
      httpCode = 408;
      break;

    // Internal server error.
    case '500':
      httpCode = 500;
      break;

    // Service unavailable.
    case '8':
    case 'received_xml':
    case 'bad_json':
    case 'ECONNRESET':
    case '503':
      httpCode = 503;
      break;

    default:
      httpCode = 400;
  }

  return httpCode;
};
