// var express = require('express');

var app = require('sockpress').init({
  secret: 'scrobblywobbly',
  resave: true,
  saveUninitialized: true
});

// var server = require('http').createServer(app);


// var io = require('socket.io')(server);

require('./config')(app);
require('./database').init();
require('./routes')(app);
require('./api')(app);

var port = process.env.PORT || 3000;
console.log('listening on port ' + port);
app.listen(port);
