var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var jade = require('gulp-jade');
var wrap = require('gulp-wrap-amd');
var livereload = require('gulp-livereload');

gulp.task('css', function() {
  return gulp.src('./src/css/styles.scss')
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 version']
    }))
    .pipe(gulp.dest('public/css/'))
    .pipe(livereload());
});

gulp.task('copy-bower', function() {
  return gulp.src([
      'bower_components/requirejs/require.js',
      'bower_components/underscore/underscore.js',
      'bower_components/es6-promise/promise.js',
      'bower_components/fetch/fetch.js'
    ])
    .pipe(gulp.dest('public/js/libs/'));
});

gulp.task('copy-src', function() {
  return gulp.src([
      'src/**/*.*',
      '!src/js/**/*.*',
      '!src/css/**/*.*',
      '!src/templates/**/*.*'
    ])
    .pipe(gulp.dest('public/'))
    .pipe(livereload());
});

gulp.task('copy-js', function() {
  return gulp.src('src/js/**/*.js')
    .pipe(gulp.dest('public/js/'))
    .pipe(livereload());
});

gulp.task('assets', ['copy-bower', 'copy-src', 'copy-js']);

gulp.task('clean', function(cb) {
  del(['public'], function() {
    cb();
  });
});

gulp.task('jade', function() {
  return gulp.src('src/templates/*.jade')
    .pipe(jade({
      compileDebug: false,
      client: true
    }))
    .pipe(wrap({
      deps: ['jade'],
      params: ['jade']
    }))
    .pipe(gulp.dest('public/js/templates'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('src/js/**/*.js', ['copy-js']);
  gulp.watch('src/templates/**/*.jade', ['jade']);
  gulp.watch('src/css/**/*.scss', ['css']);
});

gulp.task('default', ['watch']);

gulp.task('build', ['clean'], function() {
  gulp.start(['assets', 'css', 'jade']);
});

