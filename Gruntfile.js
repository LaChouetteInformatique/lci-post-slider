/* eslint-disable no-console */
/* eslint-disable lines-around-comment */
/**
 * COMMAND LINE : --mode=?
 * ----------------------
 * grunt
 * grunt --mode=robert
 *
 * Not specifying mode will trigger 'production' mode
 * Anything else than '--mode=production' will trigger 'development' mode
 */

module.exports = (grunt) => {
  console.log("\n", "--- Grunt ---", "\n");
  console.log(grunt.option("mode"));
  const devMode = "production" !== (grunt.option("mode") || "production");
  console.log("mode = " + (devMode ? "development" : "production"));

  require("load-grunt-tasks")(grunt); // https://github.com/sindresorhus/load-grunt-tasks

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    browserify: {
      target: {
        files: [
          {
            expand: true, // Enable dynamic expansion.
            cwd: "src/", // Src matches are relative to this path.
            src: ["*.js"], // Actual pattern(s) to match.
            dest: "build/", // Destination path prefix.
            ext: ".js", // Dest filepaths will have this extension.
            extDot: "first", // Extensions in filenames begin after the first dot
          },
        ],
        options: {
          browserifyOptions: { debug: devMode },
          transform: [["babelify", { presets: ["@babel/preset-env"] }]],
        },
      },
    },

    "dart-sass": {
      options: {
        sourceMap: devMode,
        outputStyle: devMode ? "expanded" : "compressed",
      },
      target: {
        files: [
          {
            expand: true, // Enable dynamic expansion.
            cwd: "src/", // Src matches are relative to this path.
            src: ["*.scss"], // Actual pattern(s) to match.
            dest: "build/", // Destination path prefix.
            ext: ".css", // Dest filepaths will have this extension.
            extDot: "first", // Extensions in filenames begin after the first dot
          },
        ],
      },
    },

    postcss: {
      // https://github.com/postcss/postcss

      options: {
        map: devMode, // inline sourcemaps if devmode == true
        processors: () => {
          return devMode
            ? [
                // https://github.com/postcss/postcss-url
                // require("postcss-url")(), // rebase, inline or copy on url().

                // 21_09_06 : no longer work, replaced by autoprefixer plugin + cssnano
                // https://github.com/csstools/postcss-preset-env
                // require('postcss-preset-env')({
                //   autoprefixer: {} // add vendor prefixes
                // }),
                require("autoprefixer")(),
                // https://github.com/postcss/postcss-reporter
                require("postcss-reporter")(), // console.log() the messages (warnings, etc.) registered by other PostCSS plugins.
              ]
            : [
                require("autoprefixer")(),
                require("cssnano")(), // minify the result // cssnano break sourcemap
                require("postcss-reporter")(),
              ];
        },
      },

      dist: {
        files: [
          {
            // Replace all css files with their modified version on the spot
            src: ["build/*.css"],
          },
        ],
      },
    },

    chokidar: {
      // WATCH
      //https://github.com/paulmillr/chokidar

      options: {
        spawn: false, // 20 times faster here
        // reload: true,
      },

      scss: {
        files: ["src/**/*.scss", "!library/**", "!node-module/**"],
        tasks: ["dart-sass", "postcss"],
      },

      js: {
        files: ["src/**/*.js", "!library/**", "!node-module/**"],
        tasks: ["browserify"],
      },
    },

    browserSync: {
      // https://www.browsersync.io/docs/grunt
      bsFiles: {
        src: [
          // "*.css",
          "/build/**/*.css",
          "/build/**/*.js",
          "**/*.php",
          "!library",
          "!node-module/**",
        ],
      },
      options: {
        // our PHP server -> go up 3 level from current directory
        proxy:
          "https://localhost/" +
          __dirname
            .split(/[\\/]/)
            .splice(__dirname.split(/[\\/]/).length - 4, 1),
        port: 80,
        open: true,
        watchTask: true,
      },
    },
  });

  // grunt.registerTask('default', ['img', 'fonts', 'security']);

  if (devMode) {
    grunt.registerTask("default", [
      "browserify",
      "dart-sass",
      "postcss",
      "browserSync",
      "chokidar",
    ]);
  } else {
    grunt.registerTask("default", ["browserify", "dart-sass", "postcss"]);
  }
};
