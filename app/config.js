var path = require('path');
var common = require('./common');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

module.exports = function(express, app) {

  app.engine('jade', require('jade').renderFile);

  app.set('view engine', 'jade');

  app.use(express.static(common.directory + 'public'));

  // Request body parsing middleware supporting JSON and urlencoded requests.
  app.use(bodyParser());

  app.use(cookieParser('scrobblescrewups'));
  // Populates req.session
  app.use(session());


  // Give templates access to the API key.
  app.locals.API_KEY = common.API_KEY;
};
