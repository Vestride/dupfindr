var common = require('./common');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
// var session = require('express-session');

module.exports = function(app) {

  app.engine('jade', require('jade').renderFile);

  app.set('view engine', 'jade');

  app.use(app.express.static(common.directory + 'public'));

  // Parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));

  // Parse application/json
  app.use(bodyParser.json());

  app.use(cookieParser('scrobblescrewups'));

  // Populates req.session
  // app.use(session({
  //   secret: 'scrobblywobbly',
  //   resave: true,
  //   saveUninitialized: true
  // }));

  // Give templates access to the API key.
  app.locals.API_KEY = common.API_KEY;
};
