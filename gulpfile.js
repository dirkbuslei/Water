// Include gulp
const gulp = require('gulp');

// Run commands
const exec = require('child_process').exec;

// Automatically load gulp plugins from package.json
const plugins = require('gulp-load-plugins')({
  pattern: '*', // by default, it only loads plugins prefixed "gulp-"
  rename: {'jshint': 'default-jshint'}, // a mapping of plugins to rename
});


const paths = {
  source: {
    js: 'src/**/*.js',
    scss: 'src/**/*.scss',
    twig: 'src/pages/**/*.twig',
    twigAll: 'src/**/*.twig',
    img: 'src/**/*.{png,gif,jpg,jpeg,svg}',
  },
  dist: {
    img: './dist/assets/img',
    css: './dist/assets/css',
    js: './dist/assets/js',
    fonts: './dist/assets/fonts',
    html: './dist'
  }
};

const autoprefixer_config = {
  browsers: [
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24', // Firefox 24 is the latest ESR
    'Explorer >= 8',
    'iOS >= 6',
    'Opera >= 12',
    'Safari >= 6'
  ],
  cascade: false
};

// Compile Twig Templates and rewrite image paths
gulp.task('twig', () => {
  return gulp.src(paths.source.twig)
    .pipe(plugins.twigUpToDate())
    .pipe(plugins.rename({dirname: ''}))
    .pipe(plugins.rewriteImagePath({path: 'assets/img'}))
    .pipe(gulp.dest(paths.dist.html))
    .pipe(plugins.browserSync.stream());
});


// Detect JS Errors
gulp.task('lint', () => {
  return gulp.src([paths.source.js])
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'));
});

// Minify JS
gulp.task('scripts', () => {
  return gulp.src([paths.source.js])
    .pipe(plugins.uglify())
    .pipe(plugins.concat('all.min.js'))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(plugins.browserSync.stream());
});

// Compile Sass
gulp.task('sass', () => {
  const processors = [
    plugins.autoprefixer(autoprefixer_config),
    plugins.cssnano(),
    plugins.postcssAssets({
      relative: './dist/assets/css',
      loadPaths: ['./dist/assets/img/**']
    })
    // plugins.postcssUrl({
    //   url: "rebase",
    //   assetsPath: './img/'
    // })
  ];

  return gulp.src(paths.source.scss)
    .pipe(plugins.sass({
      includePaths: ['./node_modules', './bower_components']
    }).on('error', plugins.sass.logError))
    .pipe(plugins.concat('all.min.css'))
    .pipe(plugins.postcss(processors))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(plugins.browserSync.stream());
});

// Optimise Images and remove Folders
gulp.task('images', () => {
  gulp.src(paths.source.img)
    // .pipe(plugins.rename({dirname: ''}))
    .pipe(plugins.newer(paths.dist.img))
    .pipe(plugins.imagemin())
    // .pipe(plugins.rename({dirname: ''}))
    .pipe(gulp.dest(paths.dist.img))
    .pipe(plugins.browserSync.stream());
});

// Watch Files For Changes
gulp.task('watch', () => {
  // Static gulp server
  plugins.browserSync.init({
    server: "./dist"
  });
  gulp.watch(paths.source.js, ['lint', 'scripts']);
  gulp.watch(paths.source.scss, ['sass']);
  gulp.watch(paths.source.twigAll, ['twig']);
  gulp.watch(paths.source.img, ['images']);
});


// Styleguide Builer
gulp.task('styleguide-build', (cb) => {
  // Use CLI version, to avoid gulp-kss dependency
  var kss = 'node ' + __dirname + '/node_modules/kss/bin/kss ';
  // Execute kss command
  exec(kss + 'src/ dist/styleguide/ --mask *.scss --js ../assets/js/all.min.js --css ../assets/css/all.min.css --markup true -b styleguide/custom-builder/ --placeholder class_name --title Water --extend styleguide/custom-builder/helpers --homepage ../styleguide/homepage.md', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
    // StyleGuide Builder CSS Assets
    gulp.src(['./styleguide/custom-builder/kss-assets/*.scss'])
      .pipe(plugins.sass())
      .pipe(plugins.concat('kss.css'))
      .pipe(plugins.postcss([plugins.autoprefixer(autoprefixer_config)]))
      .pipe(gulp.dest('dist/styleguide/kss-assets'))
      .pipe(plugins.browserSync.stream());
    // StyleGuide Components JS assets
    gulp.src(['./styleguide/components/**/*.js'])
      .pipe(plugins.uglify())
      .pipe(plugins.concat('components.min.js'))
      .pipe(gulp.dest('dist/styleguide/kss-assets'))
      .pipe(plugins.browserSync.stream());
    // StyleGuide Components CSS Assets
    gulp.src(['./styleguide/components/**/*.scss'])
      .pipe(plugins.sass())
      .pipe(plugins.concat('components.min.css'))
      .pipe(plugins.postcss([plugins.autoprefixer(autoprefixer_config)]))
      .pipe(gulp.dest('dist/styleguide/kss-assets/'))
      .pipe(plugins.browserSync.stream());
  });
});

// Styleguide Watcher
gulp.task('styleguide-watch', () => {
  // Static gulp server
  plugins.browserSync.init({
    server: "./dist"
  });
  gulp.watch('src/**/*', ['styleguide-build']);
  gulp.watch('styleguide/**/*', ['styleguide-build']);
});

// Default Task
gulp.task('default', ['lint', 'sass', 'scripts', 'images', 'watch', 'twig', 'styleguide']);

// Styleguide
gulp.task('styleguide', ['styleguide-build', 'styleguide-watch']);
