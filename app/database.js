// database.js

var Engine = require('tingodb')();
var db;

module.exports = {
  init: function(callback) {
    db = new Engine.Db('./db', {});

    db.createCollection('users', function(err/*, collection*/) {
      if (err) {
        console.log('error creating users collection');
      } else {
        console.log('users collection created');
        if ( callback ) {
          callback();
        }
      }
    });
  },

  getDatabase: function() {
    return db;
  },

  query: function() {
    // Code
  }
};
