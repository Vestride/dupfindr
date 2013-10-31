var express = require('express');
var app = express();
var request = require('request');
var _ = require('underscore');
var xml2js = require('xml2js');
var common = require('./common');
var lastfm = require('./lastfm');
var Engine = require('tingodb')();
var db = new Engine.Db('./db', {});

var port = 3000;
app.listen(port);
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
    var lastfmTrackListing = 'http://last.fm/user/' + user + '/library/music/' +
        encodeURIComponent(track.artist['#text']) + '/_/' + encodeURIComponent(track.name);

    // Make it pretty like last.fm's urls by replacing %20 with +.
    track.listing = lastfmTrackListing.replace(/%20/g, '+');

    var removeUri = '/remove/' + track.artist['#text'] + '/' + track.name + '/' + track.date.uts;
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


/*
<?xml version="1.0" encoding="utf-8"?>
<lfm status="ok">
  <session>
    <name>Shadowolf19</name>
    <key>67e452bf806562a0a2849d3970624578</key>
    <subscriber>0</subscriber>
  </session>
</lfm>
*/

/*
explicitArray = true (default)
{
  lfm:  {
    '$': {
      status: 'ok'
    },
    session: [
      {
        name: [
          'Shadowolf19'
        ],
        key: [
          '67e452bf806562a0a2849d3970624578'
        ],
        subscriber: [
          '0'
        ]
      }
    ]
  }
};

explicitArray = false
{
  lfm:  {
    '$': {
      status: 'ok'
    },
    session:  {
      name: 'Shadowolf19',
      key: '67e452bf806562a0a2849d3970624578',
      subscriber: '0'
    }
  }
}
*/
var parser = new xml2js.Parser({
  explicitArray: false
});


db.createCollection('users', function(err/*, collection*/) {
  if (err) {
    console.log('error creating users collection');
  } else {
    console.log('users collection created');
  }
});


function restrict(req, res, next) {
  console.log('---restrict---');

  // Session key available. The user has authorized our app.
  if ( req.session.sk ) {
    next();

  // New session, but they've authenticated before.
  } else if ( req.cookies.username ) {
    var collection = db.collection('users');

    collection.findOne({ username: req.cookies.username }, function(err, user) {
      if (err) {
        console.log('error getting ' + req.cookies.username);
        console.log(err);
      }

      req.session.username = user.username;
      req.session.sk = user.sessionKey;

      next();
    });


  // The token is available after the user authorizes the app,
  // but the session isn't available yet.
  } else if ( req.session.LFM_TOKEN ) {

    var method = 'auth.getSession';
    var url = lastfm.getSignedCall({
      method: method
    }, null, req.session.LFM_TOKEN);

    console.log('requesting: ' + url);

    // Make the request to Last.fm for the session.
    request(url, function(err, response, body) {
      console.log('got session response:');
      console.log(body);

      // Parse XML response from Last.fm. auth.getSession responses are only XML :(
      parser.parseString(body, function(err, result) {

        // Make sure last.fm didn't return an error
        if ( result.lfm.$.status === 'ok' ) {
          var collection = db.collection('users');
          var doc = {
            username: result.lfm.session.name,
            sessionKey: result.lfm.session.key
          };

          // Save username in a cookie so the app can check if the user already has a
          // session key stored. That's probably not safe...
          var thirtyDays = 30 * 24 * 60 * 60 * 1000;
          res.cookie('username', doc.username, { maxAge: thirtyDays, httpOnly: false });

          // Ugh, I have no idea what i'm doing...
          req.session.username = doc.username;
          req.session.sk = doc.sessionKey;
          req.session.LFM_TOKEN = null;

          // Insert new user.
          collection.insert(doc, {w:1}, function(err/*, result*/) {
            if (err) {
              console.log('error inserting recored for:', doc);
              console.log(err);
            }
          });

          next();
        } else {
          res.render('error', lastfm.getError(result, method));
        }
      });
    });

  // User needs to authenticate the app.
  } else {
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
  var token = req.query.token;
  req.session.LFM_TOKEN = token;
  res.redirect('/');
});


app.get('/duplicates-for-artist', restrict, function(req, res) {

  var artist = req.query.artist;
  var username = req.session.username;
  var url = lastfm.getCall({
    user: username,
    method: 'user.getartisttracks',
    artist: artist,
    format: 'json',
    limit: 100,
    page: 2
  });

  request(url, function(error, response, body) {

    if ( error ) {
      console.log('oops', error);
    }

    var json = JSON.parse(body);
    var tracks = json.artisttracks.track;

    var duplicates = getDuplicates(tracks);
    augmentTrackData(duplicates, username);

    console.log('duplicates: ' + duplicates.length);

    res.render('duplicates', {
      user: username,
      artist: artist,
      duplicates: duplicates
    });
  });
});


app.get('/remove/:artist/:track/:timestamp', restrict, function(req, res) {
  // Parameters are decoded already.
  var artist = req.params.artist;
  var track = req.params.track;
  var timestamp = req.params.timestamp;

  var url = lastfm.getSignedCall(null, req.session.sk, {
    artist: artist,
    track: track,
    timestamp: timestamp
  });

  console.log(url);

  // request.post();

  res.redirect('back');
});


app.get('/recommended-artists', restrict, function(req, res) {
  var url = lastfm.getSignedCall({
    method: 'user.getRecommendedArtists'
  }, req.session.sk);

  request.post(url, function(err, response, body) {
    console.log('got recommended artists response:');
    console.log(body);

    res.render('index', {});
  });
});



