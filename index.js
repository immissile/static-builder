'use strict';
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const less = require('gulp-less');
const shrink = require('gulp-cssshrink');
const del = require('del');
const rev = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const minifyHTML   = require('gulp-minify-html');
const _ = require('lodash-node');
const qn = require('./qiniu');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

module.exports = function (gulp, options) {
    var op = _.assign({
        appRoot: './',
        distSrc: 'dist/',
        jsSrc: 'js/',
        cssSrc: 'css/',
        lessSrc: 'less/',
        imgSrc: 'imgs/',
        fontSrc: 'fonts/',
        htmlSrc: 'html/',
        cssImgDirReplacements: {
            '../img/': '/img/'
        },
        autoreload: false,
        sourcemap: false,
        enableQiniuCDN: false,
        qiniu: {
            accessKey: '',
            secretKey: '',
            bucket: '',
            origin: ''
        },
        debug: false
    }, options);

    log('debug:op:', op);

    function log () {
        if (op.debug) {
            return console.log.apply(this, arguments);
        }
    }
    function srcPrefix (s) {
        return op.appRoot + '/' + (s.substr(0, 1) === '/' ? s.substr(1) : s);
    };
    function toDist (s) {
        return op.appRoot + '/dist/' + (s.substr(0, 1) === '/' ? s.substr(1) : s);
    };

    var src = {
        dist: srcPrefix(op.distSrc),
        js: srcPrefix(op.jsSrc),
        css: srcPrefix(op.cssSrc),
        less: srcPrefix(op.lessSrc),
        img: srcPrefix(op.imgSrc),
        font: srcPrefix(op.fontSrc),
        html: srcPrefix(op.htmlSrc),
        rev: toDist('rev/')
    };

    log('debug:src:', src);

    gulp.task('build-js', function () {
        return gulp.src([src.js + '**/*.js'])
            .pipe(uglify())
            .pipe(rev())
            .pipe(qn({
                enable: op.enableQiniuCDN,
                qiniu: op.qiniu,
                prefix: 'js'
            }))
            .pipe(gulp.dest(toDist(op.jsSrc)))
            .pipe(rev.manifest({
                base: './',
            }))
            .pipe(gulp.dest(toDist('rev/js/')));
    });
    gulp.task('build-img', function () {
        return gulp.src([src.img + '**/*.*'])
            .pipe(rev())
            .pipe(gulp.dest(toDist(op.imgSrc)))
            .pipe(qn({
                enable: op.enableQiniuCDN,
                qiniu: op.qiniu,
                prefix: 'imgs'
            }))
            .pipe(rev.manifest())
            .pipe(gulp.dest(toDist('rev/img/')));
    });
    gulp.task('build-font', function () {
        return gulp.src([src.font + '**/*.*'])
            .pipe(rev())
            .pipe(gulp.dest(toDist(op.fontSrc)))
            .pipe(qn({
                enable: op.enableQiniuCDN,
                qiniu: op.qiniu,
                prefix: 'fonts'
            }))
            .pipe(rev.manifest())
            .pipe(gulp.dest(toDist('rev/font/')));
    });

    gulp.task('build-css', function () {
        return gulp.src([src.css + '**/*.css'])
            .pipe(less())
            .pipe(rev())
            .pipe(gulp.dest(toDist('css-tmp/')))
            .pipe(rev.manifest())
            .pipe(gulp.dest(toDist('rev/css/')));
    });
    gulp.task('build-css-img', function () {
        return gulp.src([src.dist + 'rev/img/*.json', src.dist + 'css-tmp/**/*.css'])
            .pipe(revCollector({
                replaceReved: true,
                dirReplacements: op.cssImgDirReplacements
            }))
            .pipe(qn({
                enable: op.enableQiniuCDN,
                qiniu: op.qiniu,
                prefix: 'css'
            }))
            .pipe(shrink())
            .pipe(gulp.dest(toDist(op.cssSrc)));
    });
    // for reload css
    gulp.task('less', function() {
        return gulp.src([src.less + '**/*.less'])
            .pipe(sourcemaps.init())
            .pipe(less())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(src.css))
            .pipe(reload({stream: true}));
    });
    gulp.task('build-html', function () {
        return gulp.src([src.dist + 'rev/**/*.json', src.html + '**/*.html'])
            .pipe(revCollector({
                replaceReved: true,
                /*
                dirReplacements: {
                    '../img/': '/img/'
                }
                */
            }))
            .pipe(minifyHTML({
                empty: true,
                spare: true
            }))
            .pipe(gulp.dest(src.dist));
    });
    gulp.task('clean', function () {
        return del([src.dist]);
    });

    gulp.task('serve', ['less'], function () {
        browserSync.init({
            server: {
                baseDir: op.appRoot
            }
        });

        gulp.watch(src.less + '**/*.less', ['less']);
        gulp.watch(src.js + '**/*.js').on('change', reload);
        gulp.watch(src.html + '**/*.html').on('change', reload);
    });

    const runSequence = require('run-sequence').use(gulp);
    gulp.task('default',function(callback){
      runSequence('clean',
        ['build-css','build-js', 'build-img', 'build-font'],
        'build-html', 'build-css-img',
        callback);
    });
};
