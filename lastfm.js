
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
  var verb = 'get';
  var firstParam;
  var requestParams = exports.getCall( params, requiresSignature( params.method ) );

  if ( isWriteMethod( params.method ) ) {
    verb = 'post';

    firstParam = {
      uri: common.BASE_URL,
      form: requestParams
    };
  } else {
    firstParam = common.BASE_URL + '?';
    for ( var key in requestParams ) {
      firstParam += '&' + key + '=' + encodeURIComponent( params[ key ] );
    }
  }

  console.log('========= ' + verb + ': ', firstParam);

  request[verb](firstParam, function(err, response, body) {
    console.log('last.fm response:', body.length > 200 ? body.substring(0, 200) + '| truncated' : body);
    // console.log(body);

    var result = JSON.parse(body);
    var error = err || result.error ? result : null;

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

  return md5(signature);
};


exports.getCall = function(params, isSigned) {
  params.api_key = common.API_KEY;

  if ( isSigned ) {
    params.api_sig = exports.getApiSignature( params );
  }

  // TODO: session key here or in the request?

  params.format = 'json';

  return params;
};

