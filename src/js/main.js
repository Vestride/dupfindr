
requirejs.config({
  baseUrl: 'js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min',
    underscore: 'libs/underscore',
    jaderuntime: 'libs/runtime',
    jade: 'libs/jade'
  }
});

// Add `mapValues` to underscore.
// https://github.com/jashkenas/underscore/issues/220
require(['underscore'], function(_) {
  _.mixin({ mapValues: function (obj, f_val) {
    return _.object(_.keys(obj), _.map(obj, f_val));
  }});
});


