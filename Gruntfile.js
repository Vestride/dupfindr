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
        files: 'src/css/*.scss',
        tasks: ['css'],
      },
      js: {
        files: 'src/js/*.js',
        tasks: ['copy:js']
      }
    },


    copy: {
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
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

};