var gulp = require('gulp'),
    minify = require('gulp-minify'),
    html = require('gulp-html-beautify'),
    css = require('gulp-clean-css'),
    zip = require('gulp-zip'),
    crx = require('gulp-crx-pack'),
    clean = require('gulp-clean'),
    moment = require('moment');

// clean build folder
gulp.task('clean', () => {
    return gulp.src('build/*', {read: false})
        .pipe(clean());
});

// clean target folder
gulp.task('clean-builds', () => {
    return gulp.src('target/*', {read: false})
        .pipe(clean());
})

// copy static folders
gulp.task('copy', () => {
    gulp.src('src/img/**')
        .pipe(gulp.dest('build/img'));
    gulp.src('src/_locales/**')
        .pipe(gulp.dest('build/_locales'));
    gulp.src('node_modules/**')
        .pipe(gulp.dest('build/node_modules'));
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest('build'));
});

// html
gulp.task('html', () => {
    return gulp.src('src/pages/*.html')
        .pipe(html())
        .pipe(gulp.dest('build/pages'));
});

// css
gulp.task('css', () => {
    return gulp.src('src/css/*.css')
        .pipe(css())
        .pipe(gulp.dest('build/css'));
});

// JS
gulp.task('js', () => {
    gulp.src('src/websites/*.js')
        .pipe(minify({
            ext: {
                src: '.js',
                min: '.js'
            },
            preserveComments: 'some',
            noSource: true
        }))
        .pipe(gulp.dest('build/websites'));
    gulp.src('src/pages/*.js')
        .pipe(minify({
            ext: {
                src: '.js',
                min: '.js'
            },
            preserveComments: 'some',
            noSource: true
        }))
        .pipe(gulp.dest('build/pages'));
    return gulp.src('src/*.js')
        .pipe(minify({
            ext: {
                src: '.js',
                min: '.js'
            },
            preserveComments: 'some',
            noSource: true
        }))
        .pipe(gulp.dest('build'));
});

// build and zip
gulp.task('zip/crx/xpi', ['copy', 'html', 'css', 'js'], () => {
    var manifest = require('./src/manifest.json'),
        filename = 'Kitsu Web Scrobbler v' + manifest.version + ' ' + moment().format('D-MMM-YYYY-HH-MM');

    gulp.src('build/**')
        .pipe(zip(filename + '.zip'))
        .pipe(gulp.dest('target'));

    gulp.src('build/**')
        .pipe(crx({
            filename: filename + '.crx',
            privateKey: null /* set private key here or it will not build
            "openssl genrsa -out private.pem 2048" should works
            */
        }))
        .pipe(gulp.dest('target'));

    return gulp.src('build/**')
        .pipe(zip(filename + '.xpi'))
        .pipe(gulp.dest('target'));
});

gulp.task('default', ['clean'], () => {
    gulp.start('zip/crx/xpi');
});