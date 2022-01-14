const {src, dest, task, series, watch, parallel} = require("gulp");
const del = require('del');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const pug = require('gulp-pug');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const webp = require('gulp-webp');
const webpHTML = require('gulp-webp-html');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const gulpif = require('gulp-if');

const env = process.env.NODE_ENV;

//Подключение настроек
const {SRC_PATH, DIST_PATH, STYLE_LIBS, JS_LIBS} = require('./gulp.config');

//Tasks
task('clean', () => {
    return del(DIST_PATH);
});

task('copy', () => {
    return src(`${SRC_PATH}/assets/**`).pipe(dest(DIST_PATH));
});

task('pug', () => {
    return src(`${SRC_PATH}/pug/*pug`)
        .pipe(
            pug({
                pretty: true,
            })
        )
        // .pipe(webpHTML())
        .pipe(dest(DIST_PATH))
        .pipe(browserSync.stream());
});

task('styles', ()=> {
    return src([...STYLE_LIBS, `${SRC_PATH}/styles/main.sass`])
        .pipe(gulpif(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.sass'))
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(env === 'prod', autoprefixer({
            cascade: false
        })))
        .pipe(gulpif(env === 'prod', gcmq()))
        .pipe(gulpif(env === 'prod', cleanCSS()))
        .pipe(gulpif(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}/css/`))
        .pipe(browserSync.stream());
});

task('scripts', () => {
    return src([...JS_LIBS, `${SRC_PATH}/scripts/main.js`])
        .pipe(gulpif(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.js'))
        .pipe(gulpif(env === 'prod', babel({
            presets: ['@babel/env']
        })))
        .pipe(gulpif(env === 'prod', uglify()))
        .pipe(gulpif(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}/js/`))
        .pipe(browserSync.stream());
});

task('img', () => {
    return src(`${SRC_PATH}/img/*`)
        .pipe(newer(`${DIST_PATH}/img/`))
        .pipe(webp())
        .pipe(dest(`${DIST_PATH}/img/`))
        .pipe(src(`${SRC_PATH}/img/*`))
        .pipe(newer(`${DIST_PATH}/img/`))
        .pipe(imagemin({
            verbose: true
        }))
        .pipe(dest(`${DIST_PATH}/img/`))
        .pipe(browserSync.stream());
});

task('icons', () => {
    return src(`${SRC_PATH}/img/icons/*svg`)
        .pipe(svgo({
            plugins: [
                {
                    removeAttrs: {
                        attrs: '(fill|stroke|style|width|height|data.*)'
                    }
                }
            ]
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest(`${DIST_PATH}/img/icons`));
});

task('server', () => {
    browserSync.init({
        server: {
            baseDir: `./${DIST_PATH}`
        },
        open: false
    });
});

task('watch', () => {
    watch(`${SRC_PATH}/assets/**`, series('copy'));
    watch(`${SRC_PATH}/styles/**/*.sass`, series('styles'));
    watch(`${SRC_PATH}/pug/**/*.pug`, series('pug'));
    watch(`${SRC_PATH}/scripts/**/*.js`, series('scripts'));
    watch(`${SRC_PATH}/img/**/*`, series('img'));
    watch(`${SRC_PATH}/img/icons/*.svg`, series('icons'));
})

task('default',
    series(
        'clean',
        parallel('copy', 'pug', 'styles', 'scripts', 'img', 'icons'),
        parallel('watch', 'server')
    )
);

task('build',
    series(
        'clean',
        parallel('copy', 'pug', 'styles', 'scripts', 'img', 'icons')
    )
);
