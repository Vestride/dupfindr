
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



  app.get('/duplicates-for-artist', user.restrict, function(req, res) {
    var artist = req.query.artist;
    var username = req.session.username;
    console.log('Duplicates for artist:', artist);

    res.render('duplicates', {
      user: username,
      artist: artist
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

