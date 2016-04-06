module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    appConfig: {
      appRoot: 'www',
      webRoot: '../server/public/'
    },

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: '_sass',
          src: ['*.scss'],
          dest: '<%= appConfig.appRoot %>/assets/stylesheets',
          ext: '.css'
        }]
      }
    },

    compass: {                  // Task
      dist: {                   // Target
        options: {              // Target options
          sassDir: '_sass',
          cssDir: '<%= appConfig.appRoot %>/assets/stylesheets'
        }
      }
    },

    jst: {
      compile: {
        // options: {
        //   templateSettings: {
        //     interpolate : /\{\{(.+?)\}\}/g
        //   }
        // },
        files: {
          "<%= appConfig.appRoot %>/assets/javascripts/templates.js": ["_jst/**/*.html"]
        }
      }
    },

    watch: {
      sass: {
        files: ['_sass/**/*.scss'],
        tasks: ['compass:dist']
      },
      templates: {
        files: '_jst/**/*.html',
        tasks: 'jst',
      },
      css: {
        files: ['*.css']
      },
      livereload: {
        files: ['<%= appConfig.appRoot %>/assets/stylesheets/*.css'],
        options: { livereload: true }
      },
      copyto: {
        files: '<%= appConfig.appRoot %>/**',
        tasks: 'buildweb',
      }
    },

    copyto: {

      web: {
        files: [
          {cwd: '<%= appConfig.appRoot %>/', src: ['**/*'], dest: '<%= appConfig.webRoot %>/'}
        ],
        options: {
          ignore: [
            '<%= appConfig.appRoot %>/spec{,/**/*}',
            '<%= appConfig.appRoot %>/res{,/**/*}',
            '<%= appConfig.appRoot %>/assets/javascripts{,/**/*}',
            '<%= appConfig.appRoot %>/assets/stylesheets{,/**/*}',
            '<%= appConfig.appRoot %>/vendor{,/**/*}',
            '<%= appConfig.appRoot %>/icon.png',
            '<%= appConfig.appRoot %>/config.xml',
            '<%= appConfig.appRoot %>/spec.html'
          ]
        }
      },
      webfont: {
        files: [
          {cwd: '<%= appConfig.appRoot %>/vendor/assets/font', src: ['**/*'], dest: '<%= appConfig.webRoot %>/assets/font/'}
        ]
      }
    },

    filerev: {
      options: {
        encoding: 'utf8',
        algorithm: 'md5',
        length: 8
      },
      js: {
        src: 'assets/javascript/**/*.{js}'
      }
    },

    clean: {
      web: ["<%= appConfig.webRoot %>"]
    },

    useminPrepare: {
      html: 'www/index.html',
      options: {
        dest: '<%= appConfig.webRoot %>'
      }
    },

    usemin: {
      html: '<%= appConfig.webRoot %>/index.html'
    },

    preprocess : {
      options: {
        inline: true,
        context : {
          DEBUG: false
        }
      },
      html : {
        src : [
          '<%= appConfig.webRoot %>/index.html'
        ]
      }
      // ,
      // js : {
      //     src: '.tmp/concat/scripts/*.js'
      // }
    }

  });

  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-copy-to');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('buildweb', [
    'jst',
    //'compass:dist',
    'useminPrepare',
    'concat',
    'cssmin',
    'uglify',
    'copyto:web',
    'copyto:webfont',
    'usemin',
    'preprocess:html',  // Remove DEBUG code from production builds
  ]);

  grunt.registerTask('default', ['sass', 'compass', 'watch', 'jst', 'build']);

};
