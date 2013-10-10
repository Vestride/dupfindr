/*global require, __dirname */

// var http = require('http');
var express = require('express');
var app = express();
var request = require('request');
var _ = require('underscore');
var crypto = require('crypto');

var API_KEY = '390660b5be6817c32953e61f88d633a6';
var SECRET = '818feb0f4cd9d9feb6edb36d8861694c';
var BASE_URL = 'http://ws.audioscrobbler.com/2.0/?';
var user = 'shadowolf19';
var format = 'json';

var API_ARG = '&api_key=' + API_KEY;
var USER_ARG = '&user=' + user;
var FORMAT_ARG = '&format=' + format;

var GET_RECENT_TRACKS = BASE_URL + 'method=user.getrecenttracks' + API_ARG + USER_ARG + FORMAT_ARG +
    '&limit=10&page=1';

var artist = encodeURIComponent('Macklemore & Ryan Lewis');
var GET_ARTIST_TRACKS = BASE_URL + 'method=user.getartisttracks' + API_ARG + USER_ARG + FORMAT_ARG +
    '&artist=' + artist + '&limit=100&page=1';


app.listen(3000);
console.log('listening on port 3000');


/**
 * Tracks are the same if their timestamps are the same and their names are the same.
 * @param  {Object}  track1 The first scrobble.
 * @param  {Object}  track2 The second scrobble.
 * @return {boolean} Whether the tracks should be considered the same.
 */
function isSameScrobble(track1, track2) {
  return track1.date.uts === track2.date.uts && track1.name === track2.name;
}


function getDuplicates(tracks) {

  var scrobbles = {};
  var duplicates = [];
  for ( var i = 0, len = tracks.length; i < len; i++ ) {
    var track = tracks[ i ];
    var uts = parseInt(track.date.uts, 10);

    if ( scrobbles[ uts ] === undefined ) {
      scrobbles[ uts ] = track;
    } else if ( isSameScrobble( scrobbles[ uts ], track ) ) {
      duplicates.push(track);
    }
  }

  return duplicates;
}



function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}


function getLastfmSignature(userAuthToken, method, sessionKey) {

  var params = [
    'api_key' + API_KEY,
    'method' + method,
    'token' + userAuthToken
  ];

  if ( sessionKey ) {
    params.push('&sk=' + sessionKey);
  }

  var signature = params.sort().join('') + SECRET;

  console.log(signature);

  return md5(signature);
}


app.engine('jade', require('jade').renderFile);

app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

// Request body parsing middleware supporting JSON and urlencoded requests.
app.use(express.json());
app.use(express.urlencoded());

app.use(express.cookieParser('scrobblescrewups'));
// Populates req.session
app.use(express.session());



app.locals({
  API_KEY: API_KEY,

});

var parser = new xml2js.Parser();
// parser.parseString(data, function (err, result) {
//   console.dir(result);
//   console.log('Done');
// });

app.get('/', function(req, res) {
  var data = {
    session: req.session
  };

  if (req.session && req.session.LFM_TOKEN) {
    var signature = getLastfmSignature(req.session.LFM_TOKEN, 'auth.getsession');
    var lfmGetSession = BASE_URL + 'api_sig=' + signature + API_ARG + '&token=' + req.session.LFM_TOKEN;


  } else {
    var requestedUrl = req.protocol + '://' + req.get('Host') + req.url;
    var authUrl = 'http://www.last.fm/api/auth/?api_key=' + API_KEY +
        '&cb=' + requestedUrl + 'auth';

    data.lfmAuthUrl = authUrl;
  }

  res.render('index', data);
});

app.get('/auth', function(req, res) {
  var token = req.query.token;
  req.session.LFM_TOKEN = token;
  res.redirect('/');
});


app.get('/lfm', function(req, res) {
  console.log('getting recent tracks...');

  request(GET_ARTIST_TRACKS, function(error, response, body) {

    if ( error ) {
      console.log('oops', error);
    }

    var json = JSON.parse(body);
    var tracks = json.artisttracks.track;

    var duplicates = getDuplicates(tracks);

    console.log('duplicates: ' + duplicates.length);

    var output = '<script>';
    output += 'var duplicates = ' + JSON.stringify(duplicates, null, true);
    output += '</script>';

    res.send(output);
  });
});



