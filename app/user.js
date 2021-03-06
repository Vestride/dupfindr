// user.js
var debug = require('debug')('dupfinder:auth');
var common = require('./common');
var lastfm = require('./lastfm');
var db = require('./database').getDatabase();

// No clue if this is bad to do or not.
function updateSession(session, user) {
  session.username = user.username;
  session.sk = user.sessionKey;
}


function restrict(req, res, next) {
  debug('---restrict---');
  debug('Cookies: %o', req.signedCookies);

  // Session key available. The user has authorized our app.
  if (req.session.sk) {
    debug('session key available on session object');
    next();

  // New session, but they've authenticated before.
  } else if (req.signedCookies.username) {
    debug('new session, but they have authenticated before');
    var collection = db.collection('users');

    collection.findOne({
      username: req.signedCookies.username
    }, function(err, user) {
      if (err) {
        debug('error getting ' + req.signedCookies.username);
        debug(err);
      }

      debug('Got ' + user.username + ' from database. Setting session variables');
      updateSession(req.session, user);

      next();
    });


  // The token is available after the user authorizes the app,
  // but the session isn't available yet.
  } else if (req.session.token) {
    // debug('session has token, get the session key from lastfm');

    // Make the request to Last.fm for the session.
    lastfm.request({
      method: 'auth.getsession',
      token: req.session.token
    }, function(err, result) {

      // Make sure last.fm didn't return an error
      if (err) {
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
        res.cookie('username', doc.username, {
          maxAge: thirtyDays,
          signed: true,
          httpOnly: true
        });

        // Ugh, I have no idea what i'm doing...
        updateSession(req.session, doc);

        // Insert new user if one doesn't already exist.
        collection.update({
          username: doc.username
        }, doc, {
          upsert: true,
          w: 1
        }, function(err /*, result*/ ) {
          if (err) {
            debug('error updating recored for:', doc);
            debug(err);
          }
        });

        next();
      }
    });

  // User needs to authenticate the app.
  } else {
    debug('User needs to authenticate the app');
    // req.session.error = 'Access denied!';
    res.redirect('/needs-authentication');
  }
}


exports.restrict = restrict;
exports.updateSession = updateSession;
