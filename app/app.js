var express = require('express');
var app = express();
var server = require('http').createServer(app);

var port = process.env.PORT || 3000;
console.log('listening on port ' + port);
server.listen(port);

var io = require('socket.io')(server);

require('./config')(express, app);
require('./database').init();
require('./routes')(app);
require('./api')(app, io);
