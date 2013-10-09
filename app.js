/*global require, __dirname */

// var http = require('http');
var express = require('express');
var app = express();
var request = require('request');
var _ = require('underscore');

var API_KEY = '390660b5be6817c32953e61f88d633a6';
var SECRET = '818feb0f4cd9d9feb6edb36d8861694c';
var BASE_URL = 'http://ws.audioscrobbler.com/2.0/';
var user = 'shadowolf19';
var format = 'json';

var API_ARG = '&api_key=' + API_KEY;
var USER_ARG = '&user=' + user;
var FORMAT_ARG = '&format=' + format;

var GET_RECENT_TRACKS = BASE_URL + '?method=user.getrecenttracks' + API_ARG + USER_ARG + FORMAT_ARG +
    '&limit=10&page=1';

var artist = encodeURIComponent('Macklemore & Ryan Lewis');
var GET_ARTIST_TRACKS = BASE_URL + '?method=user.getartisttracks' + API_ARG + USER_ARG + FORMAT_ARG +
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

// GET /javascripts/jquery.js
// GET /style.css
// GET /favicon.ico
app.use(express.static(__dirname + '/public'));

// Request body parsing middleware supporting JSON and urlencoded requests.
app.use(express.json());
app.use(express.urlencoded());


app.get('/', function(req, res) {
  res.render('index');
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



