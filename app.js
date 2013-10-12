/*global require, __dirname */

// var util = require('util');
var express = require('express');
var app = express();
var request = require('request');
// var _ = require('underscore');
var xml2js = require('xml2js');
var common = require('./common');
var lastfm = require('./lastfm');


var API_ARG = '&api_key=' + common.API_KEY;
var USER_ARG = '&user=' + 'shadowolf19';
var FORMAT_ARG = '&format=json';

var GET_RECENT_TRACKS = common.BASE_URL + 'method=user.getrecenttracks' + API_ARG + USER_ARG + FORMAT_ARG +
    '&limit=10&page=1';

var artist = encodeURIComponent('Macklemore & Ryan Lewis');
var GET_ARTIST_TRACKS = common.BASE_URL + 'method=user.getartisttracks' + API_ARG + USER_ARG + FORMAT_ARG +
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
  API_KEY: common.API_KEY
});

var parser = new xml2js.Parser();

app.get('/', function(req, res) {

  // User has authorized the app
  if (req.session && req.session.LFM_TOKEN) {
    var token = req.session.LFM_TOKEN;
    var method = 'auth.getSession';
    var signature = lastfm.getSignature(token, method);
    var url = lastfm.getSignedCall(token, signature, null, {
      method: method
    });

    console.log('requesting: ' + url);

    // Make the request to Last.fm.
    request(url, function(err, response, body) {
      console.log('got session response:', body);

      // Parse XML response.
      parser.parseString(body, function (err, result) {

        // Make sure last.fm didn't return an error
        if ( result.lfm.$.status === 'ok' ) {
          req.session.username = result.lfm.session.name;
          req.session.sk = result.lfm.session.key;
          res.render('index', {});
        } else {
          res.render('error', lastfm.getError(result, 'auth.getSession'));
        }
      });
    });

  // User hasn't authorized the app
  } else {
    res.redirect('/needs-authentication');
  }
});

app.get('/needs-authentication', function(req, res) {
  var requestedUrl = req.protocol + '://' + req.get('Host');// + req.url;
  console.log('requested url: ' + requestedUrl);
  var authUrl = 'http://www.last.fm/api/auth/?api_key=' + common.API_KEY +
      '&cb=' + requestedUrl + '/auth';

  res.render('needs-auth', {
    lfmAuthUrl: authUrl
  });
});

app.get('/auth', function(req, res) {
  var token = req.query.token;
  req.session.LFM_TOKEN = token;
  res.redirect('/');
});


app.get('/lfm', function(req, res) {
  console.log('getting recent tracks...');

  var artist = req.query.artist;

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



