'use strict';

let gulp = require('gulp-param')(require("gulp"), process.argv),
	yaml = require('gulp-yaml'),
	clean = require('gulp-clean'),
	jsoncombine = require("gulp-jsoncombine"),
	VideoParser = require('./lib/video-parser'),
	through = require('through2'),
	utils = require('./lib/utils'),
	camelCase = require('camelcase')

gulp.task('clean', function() {
  return gulp.src(['dist'], {read: false})
    .pipe(clean());
});

gulp.task('compile', ['clean'], function(youtube, vimeo) {
	let videoParser = new VideoParser({
	    youtube: {
	        key: youtube
	    },
	    vimeo: {
	        access_token: vimeo
	    },
	    disableCache: true
	})

	return gulp.src('./src/**/*.yml')
		// compile YAML to JSON
		.pipe(yaml({
			safe: true,
			space: 2
		}))
		// concat JSON files in to one
		.pipe(jsoncombine('config.json', (data, meta) => {
			let result = {};
			for (let key in data) {
				if (~key.indexOf('/')) {
					let collectionName = camelCase(key.split('/')[0])
					let collection = result[collectionName] || (result[collectionName] = [])
					collection.push(data[key])
				} else {
					result[key] = data[key]
				}
			}
			return new Buffer(JSON.stringify(result));
		}))
		// get video metadata
		.pipe(through.obj((file, enc, cb) => {
			utils.populateVideos(JSON.parse(file.contents.toString()), videoParser)
				.then((result) => {
					file.contents = new Buffer(JSON.stringify(result))
					cb(null, file)
				})
		}))
		.pipe(gulp.dest('./dist'));
})

gulp.task('images', ['clean'], function() {
	return gulp.src(['./img/*'])
		.pipe(gulp.dest('./dist/img'))
})

gulp.task('build', ['compile', 'images'])

gulp.task('watch', function() {
	gulp.watch(['./src/**/*', 'gulpfile.js'], ['build'])
})

gulp.task('default', ['build']);