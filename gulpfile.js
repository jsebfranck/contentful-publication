var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  mocha = require('gulp-mocha');

gulp.task('jshint', function () {
  gulp.src('lib/*.*')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('test', function() {
  return gulp.src('test/*.*', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});
gulp.task('default', ['jshint', 'test']);
