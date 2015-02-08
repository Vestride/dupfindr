// common.js
var path = require('path');
var util = require('util');

exports.API_KEY = '390660b5be6817c32953e61f88d633a6';
exports.SECRET = '818feb0f4cd9d9feb6edb36d8861694c';
exports.BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

// Deep logs.
exports.log = function() {
  var args = [].slice.call(arguments).map(function(object) {
    return util.inspect(object, false, null);
  });
  console.log.apply(console, args);
};

exports.directory = path.join(__dirname, '../');
