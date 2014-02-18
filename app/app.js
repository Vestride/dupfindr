var express = require('express');
var app = express();
var server = require('http').createServer(app);

var port = 3000;
app.listen(port);
server.listen(8080);
console.log('listening on port ' + port);

var config = require('./config')(express, app);
var db = require('./database').init();
var routes = require('./routes')(app);
var api = require('./api')(app);


