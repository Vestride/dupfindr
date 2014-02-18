
var fs = require('fs');
var common = require('./common');
var lastfm = require('./lastfm');
var user = require('./user');
var helpers = require('./helpers');


module.exports = function( app ) {
  app.get('/', user.restrict, function(req, res) {
    res.render('index');
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


  app.get('/topartists', user.restrict, function(req, res) {
    var params = {
      user: req.session.username,
      method: 'user.gettopartists',
      limit: 50,
    };

    // lastfm.request(params, function(err, result) {
    fs.readFile('./test/topartists.json', function (err, data) {
      var result = JSON.parse(data);
      if ( err ) {
        res.json(400, {
          ok: false,
          err: result.error,
          message: result.message,
          generic: 'Oops, there was a problem.'
        });
        return;
      }

      // common.log(result.topartists['@attr']);
      // user
      // type: 'overall'
      // page
      // perPage
      // totalPages
      // total

      var artists = result.topartists.artist;
      // TODO remove when i have updated json
      artists.length = 12;
      res.json({
        artists: artists
      });
    });
  });


  app.get('/artist-duplicates', user.restrict, function(req, res) {

    var artist = decodeURIComponent(req.query.artist);

    if ( !artist || artist === 'null' || artist === 'undefined' ) {
      res.json(400, {
        ok: false,
        err: result.error,
        message: 'No artist given',
        generic: 'Oops, there was a problem.'
      });
      return;
    }

    var username = req.session.username;
    var params = {
      user: username,
      method: 'user.getartisttracks',
      artist: artist,
      limit: 250,
      // page: 2
    };

    lastfm.request(params, function(err, result) {

      if ( err || !result.artisttracks.track ) {
        res.json(400, {
          ok: false,
          err: result.error,
          message: result.message,
          generic: 'Oops, there was a problem.'
        });
        return;
      }

      // console.log(result);
      var tracks = result.artisttracks.track;
      console.log('Total tracks by ' + artist + ' = ' + tracks.length);

      var duplicates = helpers.getDuplicates(tracks);
      helpers.augmentTrackData(duplicates, username);

      console.log('duplicates: ' + duplicates.length);

      res.json({
        user: username,
        artist: artist,
        duplicates: duplicates
      });
    });
  });



  app.get('/duplicates-for-artist', user.restrict, function(req, res) {
    var artist = req.query.artist;
    var username = req.session.username;

    res.render('duplicates', {
      user: username,
      artist: artist
    });
  });


  // Ajax hook for deleting a scrobble.
  app.post('/remove-track', user.restrict, function(req, res) {
    // Parameters are decoded already.
    var params = {
      method: 'library.removescrobble',
      artist: req.body.artist,
      track: req.body.track,
      timestamp: req.body.timestamp,
      sk: req.session.sk
    };

    lastfm.request(params, function(err, result) {
      var status = 200;
      var resp = { ok: true };
      if ( err ) {
        status = 501;
        resp.ok = false;
      }

      // Send json response.
      res.json(status, resp);
    });
  });


  app.get('/recommended-artists', user.restrict, function(req, res) {

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
};

