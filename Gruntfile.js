module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      build: ['public/*', 'temp/'],
      temp: ['temp']
    },

    watch: {
      options: {
        livereload: true,
      },
      css: {
        files: 'src/css/**/*.scss',
        tasks: ['css'],
      },
      js: {
        files: 'src/js/**/*.js',
        tasks: ['copy:js']
      },
      jade: {
        files: 'src/templates/**/*.jade',
        tasks: ['jade:compile']
      }
    },


    copy: {
      bower: {
        files: [
          {
            expand: true,
            cwd: 'bower_components/requirejs/',
            src: ['require.js'],
            dest: 'public/js/'
          }
        ]
      },
      js: {
        files: [
          {
            expand: true,
            cwd: 'src/js/',
            src: ['**'],
            dest: 'public/js/'
          }
        ]
      },
      assets: {
        files: [
          {
            expand: true,
            cwd: 'src/img/',
            src: ['**'],
            dest: 'public/img/'
          },
          {
            expand: true,
            cwd: 'src/fonts/',
            src: ['**'],
            dest: 'public/fonts/'
          },
        ]
      }
    },


    sass: {                              // Task
      dist: {                            // Target
        options: {                       // Target options
          style: 'expanded'
        },
        files: {                         // Dictionary of files
          'temp/css/styles.css': 'src/css/styles.scss',       // 'destination': 'source'
        }
      }
    },


    autoprefixer: {
      options: {
        browsers: ['last 2 versions']
      },

      main: {
        src: 'temp/css/styles.css',
        dest: 'public/css/styles.css'
      }
    },

    jade: {
      compile: {
        options: {
          compileDebug: true,
          amd: true,
          namespace: false,
          client: true,
          data: {
            glen: true
          }
        },
        files: [{
          expand: true,
          filter: 'isFile',
          cwd: 'src/templates/',
          src: ['**'],
          dest: 'public/js/templates/',
          ext: '.js'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-autoprefixer');

  // Default task(s).
  grunt.registerTask('default', ['watch']);

  grunt.registerTask('assets', 'copies fonts and images to public directory', function() {
    grunt.task.run('copy:assets');
  });


  grunt.registerTask('css', 'compile and prefix css', function() {
    grunt.task.run('sass');
    grunt.task.run('autoprefixer:main');
    grunt.task.run('clean:temp');
  });



  grunt.registerTask('build', function() {
    grunt.task.run('clean');
    grunt.task.run('copy:bower');
    grunt.task.run('copy:js');
    grunt.task.run('copy:assets');
    grunt.task.run('css');
    grunt.task.run('jade:compile');
  });




};
