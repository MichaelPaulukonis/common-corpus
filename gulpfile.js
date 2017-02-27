var gulp = require(`gulp`),
    eslint = require(`gulp-eslint`),
    mocha = require(`gulp-mocha`),
    gulpif = require(`gulp-if`);

var isFixed = function(file) {
    // Has ESLint fixed the file contents?
  return file.eslint != null && file.eslint.fixed;
};

gulp.task(`lint`, function() {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src([`**/*.js`,`!node_modules/**`, `!coverage/**`, `!corpus/sentences/**`])
  // eslint() attaches the lint output to the "eslint" property
  // of the file object so it can be used by other modules.
    .pipe(eslint({fix: true}))
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failAfterError last.
  // .pipe(eslint.failAfterError());
  // commented out the above, and added gulp-if references per:
  // http://stackoverflow.com/questions/37107999/how-to-fix-file-with-gulp-eslint
  // if fixed, write the file to dest
    .pipe(gulpif(isFixed, gulp.dest(`./`)));
});



gulp.task(`test`, function() {
  return gulp.src(`test/*.js`)
    .pipe(mocha());
});

gulp.task(`default`, [`lint`], function() {
  gulp.start(`test`);
});
