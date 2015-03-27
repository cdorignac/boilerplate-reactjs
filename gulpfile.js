// gulp
var gulp =        require('gulp');
var gutil =       require('gulp-util');
var plumber =     require('gulp-plumber');
var less =        require('gulp-less');
var sourcemaps =  require('gulp-sourcemaps');
var rename =      require("gulp-rename");
var babel =       require("gulp-babel");
var runSequence = require('run-sequence');
var source =      require('vinyl-source-stream');
var react =       require('gulp-react');

// jshint
var jshint =      require('gulp-jshint');
var stylish =     require('jshint-stylish');

var browserify =  require('browserify');

var del =         require('del');
var _ =           require('lodash');
                  require('colors');


var paths_build         = './build/www',
    paths_build_css     = paths_build+'/css',
    paths_build_js      = paths_build+'/js',
    paths_build_res     = paths_build+'/res',
    paths_build_html    = paths_build,

    paths_compiled_js   = './build/js-compiled',
    files_app_main      = 'app.jsx',

    paths_src_js        = './src/js',
    paths_src_css       = './src/css',
    paths_src_res       = './res',
    paths_src_html      = './src/index.html',

    files_build_js_libs = 'libs.js',
    files_build_js_main = 'main.js',
    files_build_css     = 'main.css';

var jsLibs = [ ];
var paths_separate_js = [];

var server = function(){ return require('./server.js') };

gulp.task('default', ['watch']);

gulp.task('watch', function(done){
    gutil.log("task: watch");
    doWatch(done);
});

function doWatch(cb){
    gutil.log("method: doWatch");
    runSequence('clean-build', ['res', 'js', 'css', 'html'],
        function(){
            startWatchServer();
            gutil.log( ("Start watching...").blue );
            watchJS();
            watchCSS();
            watchHTML();
            cb();
        });
}

function watchCSS(){
    gulp.watch(paths_src_css+'/*', ['css']);
}

function watchJS(){
    gulp.watch([paths_src_js+'/**/*.js', paths_src_js+'/**/*.jsx'], ['js-reload']);
}

function watchHTML(){
    gulp.watch(paths_src_html, ['html']);
}

function bundleBrowserify(b, destFile, destLocation){
    return b.bundle()
        .on('error', function(err){console.log(err);})
        .pipe(source(destFile))
        .pipe(gulp.dest(destLocation));
}

function bundleApp(src, destFile, destFolder){
    gutil.log("bundle app:"+src);
    var b = browserify({ entries: src, debug: true});
    _(jsLibs).forEach(b.external, b);

    return bundleBrowserify(b, destFile, destFolder);;
}

/***************************
  JS
***************************/
gulp.task('js', function (done) {
	runSequence(['lint', 'js-compile', 'js-libs'], function(){
        bundleApp(paths_compiled_js+'/'+files_app_main, files_build_js_main, paths_build_js);
        done();
    });   
});

gulp.task('js-reload', function(done) {
    runSequence('js',
        function(){
            gutil.log( ("JS Reloaded.").blue );
            restartWatchServer();
            done();
        });
});

gulp.task('js-compile', function() {
    gutil.log( ("\n\nRecompiling").green );

    return gulp.src([paths_src_js+'/**/*.js*'])
        .pipe(plumber())
        .pipe(babel({ ast: false }))
        .pipe(gulp.dest(paths_compiled_js));
});

// external libs
gulp.task('js-libs', function () {
    // loaded separately (essentially compat stuff for IE8)
    _(paths_separate_js).forEach(function(path){
        gulp.src(path).pipe(gulp.dest(paths_build_js));
    });

    var b = browserify({debug: true});
    _(jsLibs).forEach(b.require, b);

    return bundleBrowserify(b, files_build_js_libs, paths_build_js);
});

/***************************
  CSS
***************************/
gulp.task('css', function(){
	return gulp.src(paths_src_css+'/main.less')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write())
        .pipe(rename(files_build_css))
        .pipe(gulp.dest(paths_build_css));
});

/***************************
  Res
***************************/
gulp.task('res', function(){
    return gulp.src(paths_src_res+'/**')
        .pipe(gulp.dest(paths_build_res));
});


/***************************
  HTML
***************************/
gulp.task('html', function(){
    return gulp.src(paths_src_html)
        .pipe(gulp.dest(paths_build_html));
});

/***************************
  Clean
***************************/
gulp.task('clean-build', function(done) {
    del([paths_build],function(){
        del([paths_compiled_js], done);
    });
});

/***************************
  Code quality
***************************/
gulp.task('lint', function() {
    gulp.src(paths_src_js+'/**/*.js*')
        .pipe(plumber())
        .pipe(react({ harmony: false }))
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

/***************************
  Server
***************************/
var watchServer = null;

function startWatchServer(){
    var port = 8080;
    watchServer = server().init(port);
    gutil.log(("Common server on "+port).blue);
}

function restartWatchServer(){
    // only restart an existing one
    if(watchServer){
        gutil.log( ("Reloading server...").blue );
        watchServer.close();
        startWatchServer();
    }
}