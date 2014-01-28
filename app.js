var express = require('express');
var app = express();
var server = require('http').createServer(app);
// var io = require('socket.io').listen(server);
// var request = require('request');
var _ = require('underscore');
var common = require('./common');
var lastfm = require('./lastfm');
// var io = require('./sockets').io;
var Engine = require('tingodb')();
var db = new Engine.Db('./db', {});
var fs = require('fs');

var port = 3000;
app.listen(port);
server.listen(8080);
console.log('listening on port ' + port);




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

function augmentTrackData(tracks, user) {
  _.forEach(tracks, function(track) {
    track.artist.name = track.artist['#text'];
    track.date.text = track.date['#text'];

    var lastfmTrackListing = 'http://last.fm/user/' + user + '/library/music/' +
        encodeURIComponent(track.artist.name) + '/_/' + encodeURIComponent(track.name);

    // Make it pretty like last.fm's urls by replacing %20 with +.
    track.listing = lastfmTrackListing.replace(/%20/g, '+');

    var removeUri = '/remove/' + track.artist.name + '/' + track.name + '/' + track.date.uts;
    track.removeUrl = encodeURI(removeUri);
  });
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


// Give templates access to the API key.
app.locals({
  API_KEY: common.API_KEY
});


db.createCollection('users', function(err/*, collection*/) {
  if (err) {
    console.log('error creating users collection');
  } else {
    console.log('users collection created');
  }
});


// function onSocketsConnected(socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('sup', function (data) {
//     console.log(data);
//   });

//   socket.on('removeScrobble', function() {

//   });
// }

// io.sockets.on('connection', onSocketsConnected);


// No clue if this is bad to do or not.
function updateSession(session, user) {
  session.username = user.username;
  session.sk = user.sessionKey;
}


function restrict(req, res, next) {
  console.log('---restrict---');
  console.log('Cookies:');
  common.log(req.cookies);

  // Session key available. The user has authorized our app.
  if ( req.session.sk ) {
    console.log('session key available on session object');
    next();

  // New session, but they've authenticated before.
  } else if ( req.cookies.username ) {
    console.log('new session, but they have authenticated before');
    var collection = db.collection('users');

    collection.findOne({ username: req.cookies.username }, function(err, user) {
      if (err) {
        console.log('error getting ' + req.cookies.username);
        console.log(err);
      }

      console.log('Got ' + user.username + ' from database. Setting session variabes');
      updateSession(req.session, user);

      next();
    });


  // The token is available after the user authorizes the app,
  // but the session isn't available yet.
  } else if ( req.session.token ) {
    console.log('session has token, get the session key from lastfm');

    // Make the request to Last.fm for the session.
    lastfm.request({
      method: 'auth.getsession',
      token: req.session.token
    }, function(err, result) {

      // Make sure last.fm didn't return an error
      if ( err ) {
        res.render('error', result);

      } else {
        var collection = db.collection('users');
        var doc = {
          username: result.session.name,
          sessionKey: result.session.key
        };

        // Save username in a cookie so the app can check if the user already has a
        // session key stored. That's probably not safe...
        var thirtyDays = 30 * 24 * 60 * 60 * 1000;
        res.cookie('username', doc.username, { maxAge: thirtyDays, httpOnly: false });

        // Ugh, I have no idea what i'm doing...
        updateSession(req.session, doc);

        // Insert new user if one doesn't already exist.
        collection.update({username: doc.username}, doc, {upsert: true, w:1}, function(err/*, result*/) {
          if (err) {
            console.log('error updating recored for:', doc);
            console.log(err);
          }
        });

        next();
      }
    });

  // User needs to authenticate the app.
  } else {
    console.log('User needs to authenticate the app');
    // req.session.error = 'Access denied!';
    res.redirect('/needs-authentication');
  }
}

app.get('/', restrict, function(req, res) {
  res.render('index', {});
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
  req.session.token = req.query.token;
  res.redirect('/');
});


app.get('/duplicates-for-artist', /*restrict, */function(req, res) {

  var artist = req.query.artist;
  // var username = req.session.username;
  // var params = {
  //   user: username,
  //   method: 'user.getartisttracks',
  //   artist: artist,
  //   limit: 100,
  //   page: 2
  // };

  // lastfm.request(params, function(err, result) {

  //   if ( err ) {
  //     res.render('error', result);
  //     return;
  //   }

  //   var tracks = result.artisttracks.track;

  //   var duplicates = getDuplicates(tracks);
  //   augmentTrackData(duplicates, username);

  //   console.log('duplicates: ' + duplicates.length);

  //   res.render('duplicates', {
  //     user: username,
  //     artist: artist,
  //     duplicates: duplicates
  //   });
  // });

  fs.readFile('./macklemore.json', function (err, data) {
    if (err) throw err;
    console.log(data);

    var result = JSON.parse(data);
    var tracks = result.artisttracks.track;

    var duplicates = getDuplicates(tracks);
    augmentTrackData(duplicates, 'Shadowolf19');

    console.log('duplicates: ' + duplicates.length);

    res.render('duplicates', {
      user: 'Shadowolf19',
      artist: artist,
      duplicates: duplicates
    });
  });
});


app.post('/remove/:artist/:track/:timestamp', restrict, function(req, res) {
  // Parameters are decoded already.
  var params = {
    artist: req.params.artist,
    track: req.params.track,
    timestamp: req.params.timestamp,
    sk: req.session.sk
  };

  // lastfm.request(params, function(err, result) {
  //   if ( err ) {
  //     res.render('error', result);
  //   } else {
  //     res.render('index', {});
  //   }
  // });

  res.redirect('back');
});


app.get('/recommended-artists', restrict, function(req, res) {

  var params = {
    method: 'user.getrecommendedartists',
    sk: req.session.sk
  };

  lastfm.request(params, function(err, result) {

    if ( err ) {
      res.render('error', result);
    } else {
      res.render('index', {});
    }
  });
});



