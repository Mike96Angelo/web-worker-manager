
module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        uglify: {
            compile: {
                options: {
                    mangle: true,
                    compress: true,
                    beautify: false
                },
                files: {
                    'web-worker-manager.js': [
                        'lib/Job.js',
                        'lib/Worker.js',
                        'lib/Manager.js'
                    ]
                }
            }
        },
        watch: {
            uglify: {
                files: [
                    'lib/*.js'
                ],
                tasks: [
                    'uglify:compile'
                ]
            }
        }
    });
};
