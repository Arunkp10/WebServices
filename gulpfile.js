var gulp = require('gulp'),
    concat = require('gulp-concat');

gulp.task('default', ['test'], function()
{
	gulp.watch ('src/test/js/*.js', ['test']);
  //gulp.watch('src/sass/**/*.scss', ['styles']);
  //gulp.watch('src/css/**/*.css', ['styles']);
});

gulp.task('rebuild', function() {
    
});

gulp.task('sass', function() {
    return gulp.src('src/sass/**/*.scss')
        .pipe(sass({style: 'expanded'}))
        .pipe(gulp.dest('temp/css/'))
});

gulp.task('css', function() {
    return gulp.src('src/css/**/*.css')
        .pipe(gulp.dest('temp/css/'))
});

gulp.task('styles', ['sass','css'], function() {
    return gulp.src('temp/css/*.css')
        .pipe(concat('style.min.css'))
        .pipe(minifyCss())
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('images', function() {
  return gulp.src('src/img/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('coffee', function() {
    return gulp.src('src/coffee/*.coffee')
        .pipe(coffee({bare: true}))
        .pipe(gulp.dest('temp/js/'));
});

gulp.task('js', function() {
    return gulp.src('src/js/*.js')
        .pipe(gulp.dest('temp/js/'));
});

gulp.task('scripts', ['js'], function () {
	return gulp.src('temp/js/*.js')
		.pipe(concat('test.js'))
		.pipe(gulp.dest('static/js/'));
});

gulp.task('html', function() {
    return gulp.src('index.html')
        .pipe(gulp.dest('dist/'));
});

// Concatenate files used to make test.js
gulp.task('test', function ()
{
	return gulp.src ('src/test/js/*.js')
		.pipe (concat ('test.js'))
		.pipe (gulp.dest ('static/js/'));
});
