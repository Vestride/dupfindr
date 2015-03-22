
// var fs = require('fs');
var _ = require('underscore');
// var common = require('./common');
var lastfm = require('./lastfm');
var user = require('./user');
var helpers = require('./helpers');


module.exports = function( app, io ) {
  console.log('listen for connection');

  io.on('connection', function(socket) {
    console.log('A user connected', socket.id);

    socket.on('disconnect', function() {
      console.log('user disconnected', this.id);
    });

    socket.on('bar', function() {
      console.log('bar:', this.id);
    });

    // setTimeout(function() {
    //   socket.emit('later', 'hi');
    // }, 500);
  });

  // app.io.route('bar', function(req) {
  //   console.log('bar:', req.session.username);
  // });

  app.get('/top-artists', user.restrict, function(req, res) {
    var page = req.query.page || 1;
    var params = {
      user: req.session.username,
      method: 'user.gettopartists',
      limit: 12,
      page: page
    };

    lastfm.request(params, function(err, result) {
    // fs.readFile('./test/topartists.json', function (err, data) {
    //   var result = JSON.parse(data);
      if ( err ) {
        res.status(lastfm.getHttpErrorCode(err)).json({
          ok: false,
          err: err,
          message: result.message,
          generic: 'Oops, there was a problem.'
        });
        return;
      }

      var attr = result.topartists['@attr'];
      var artists = result.topartists.artist;

      res.json({
        page: attr.page,
        perPage: attr.perPage,
        totalPages: attr.totalPages,
        total: attr.total,
        artists: artists
      });
    });
  });


  app.get('/artist-duplicates', user.restrict, function(req, res) {

    var artist = decodeURIComponent(req.query.artist);
    console.log('get:', artist);

    if ( !artist || artist === 'null' || artist === 'undefined' ) {
      res.status(400).json({
        ok: false,
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
      limit: 50000,
      // page: 2
    };

    var requestSentTime = Date.now();

    res.status(200).json({
      message: 'Waiting for last.fm'
    });

    // TODO(glen): See if there are any duplicate tracks stored in the database.
    // If there are, get those and request tracks from that timestamp until now.
    // If there aren't, request all tracks.
    // Although, for every duplicate which is removed, the database will have to be
    // updated and if the user removes the scrobble from somewhere else, the
    // database has no way of knowing that...

    // setTimeout(function() {
    //   // CONNECTION NOW CLOSED
    //   console.log('my async socket:', socket.id);
    //   console.log('socket connected:', socket.connected, '. connection readyState:', socket.conn.readyState);
    //   socket.emit('artist-duplicates', {
    //     ok: false,
    //     generic: 'Oops, there was a problem.'
    //   });

    //   // console.log(Date.now());
    //   // io.emit('artist-duplicates', {
    //   //   ok: false,
    //   //   generic: 'Oops, there was a problem.'
    //   // });

    //   // io.emit('later', 'to you');

    // }, 100);

    // setTimeout(function() {
    //   // CONNECTION NOW CLOSED
    //   console.log('my async socket:', socket.id);
    //   console.log('socket connected:', socket.connected, '. connection readyState:', socket.conn.readyState);
    //   socket.emit('artist-duplicates', {
    //     ok: false,
    //     generic: 'Oops, there was a problem.'
    //   });

    //   // console.log(Date.now());
    //   // io.emit('artist-duplicates', {
    //   //   ok: false,
    //   //   generic: 'Oops, there was a problem.'
    //   // });

    //   // io.emit('later', 'to you');

    // }, 100);
    /*
    lastfm.request(params, function(err, result) {

      console.log('Request for ' + artist + ' took ' +
        ((Date.now() - requestSentTime) / 1000).toFixed(2) + ' seconds.');

      if ( err || !(result && result.artisttracks && result.artisttracks.track) ) {
        console.log('something wrong');
        if (result && result.artisttracks && !result.artisttracks.track) {
          result.message = 'You have not scrobbled any tracks by ' + artist;
        }
        // res.status(lastfm.getHttpErrorCode(err)).json({
        //   ok: false,
        //   err: err,
        //   message: result.message,
        //   generic: 'Oops, there was a problem.'
        // });
        socket.emit('artist-duplicates', {
          status: lastfm.getHttpErrorCode(err),
          ok: false,
          err: err,
          message: result.message,
          generic: 'Oops, there was a problem.'
        });
        return;
      }

      var tracks = result.artisttracks.track;
      var duplicates = helpers.getDuplicates(tracks);
      helpers.augmentTrackData(duplicates, username);

      // TODO(glen) check tracks.length against the total in top artists.
      console.log('Total tracks by ' + artist + ' = ' + tracks.length);
      console.log('duplicates: ' + duplicates.length);

      // res.json({
      //   user: username,
      //   artist: artist,
      //   duplicates: duplicates
      // });

      console.log('socket connected:', socket.connected, '. connection readyState:', socket.conn.readyState);
      socket.emit('artist-duplicates', {
        user: username,
        artist: artist,
        duplicates: duplicates
      });
    });
    */
  });


  // Ajax hook for deleting a scrobble.
  app.post('/remove-track', user.restrict, function(req, res) {

    var artist = decodeURIComponent(req.body.artist);
    var track = decodeURIComponent(req.body.track);
    var timestamp = decodeURIComponent(req.body.timestamp);
    console.log('remove-track', artist, '-', track);

    if ( _.isUndefined(artist) || _.isUndefined(track) || _.isUndefined(timestamp) ) {
      res.status(400).json({
        ok: false,
        message: 'Missing required parameters',
        generic: 'Oops, there was a problem.'
      });
      return;
    }

    // Parameters are decoded already.
    var params = {
      method: 'library.removescrobble',
      artist: artist,
      track: track,
      timestamp: timestamp,
      sk: req.session.sk
    };

    lastfm.request(params, function(err, result) {
      var resp = { ok: true };
      if ( err ) {
        resp.ok = false;
        resp.message = result.message;
      }

      // Send json response.
      res.status(lastfm.getHttpErrorCode(err)).json(resp);
    });
  });


};
