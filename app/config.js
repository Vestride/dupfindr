var path = require('path');
var common = require('./common');

module.exports = function(express, app) {

  app.engine('jade', require('jade').renderFile);

  app.set('view engine', 'jade');

  app.use(express.static(path.join(__dirname, '../', 'public')));

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
};
