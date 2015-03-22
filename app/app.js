var express = require('express');
var app = express();
var server = require('http').createServer(app);

var port = process.env.PORT || 3000;
app.listen(port);
server.listen(8080);
console.log('listening on port ' + port);

require('./config')(express, app);
require('./database').init();
require('./routes')(app);
require('./api')(app);


