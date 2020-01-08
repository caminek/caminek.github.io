// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cp = require("child_process");
const cssnano = require("cssnano");
const del = require("del");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./_site/"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function clean() {
  return del(["./_site/assets/"]);
}

// Optimize Images
function images() {
  return gulp
    .src("./_assets/img/**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./_site/assets/img"));
}

// CSS task
function css() {
  return gulp
    .src("./_assets/scss/**/*.scss")
    .pipe(sass({ includePaths : ['./_assets/scss/'] }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./_site/assets/css/"))
}

// Javascript
function js() {
    return gulp
    .src("./_assets/js/**/*")
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(gulp.dest("./_site/assets/js/"))
}

// Jekyll
function jekyll() {
  return cp.spawn("bundle", ["exec", "jekyll", "build", "--config", "./_config.dev.yml"], { stdio: "inherit" });
}

// Watch files
function watchFiles() {
  gulp.watch("./_assets/scss/**/*", css);
  //gulp.watch("./_assets/js/*", gulp.series(scriptsLint, scripts));
  gulp.watch("./_assets/js/*", js);
  gulp.watch(
    [
      "./_includes/**/*",
      "./_layouts/**/*",
      "./_pages/**/*",
      "./_posts/**/*",
      "./_projects/**/*"
    ],
    gulp.series(jekyll, browserSyncReload)
  );
  gulp.watch("./_assets/img/**/*", images);
}

// define complex tasks
const build = gulp.series(clean, jekyll, gulp.parallel(css, images, js));;
const watch = gulp.parallel(watchFiles, browserSync);

// export tasks
exports.images = images;
exports.css = css;
exports.js = js;
exports.jekyll = jekyll;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;