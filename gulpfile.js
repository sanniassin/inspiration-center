'use strict';

let gulp = require('gulp-param')(require("gulp"), process.argv)
let yaml = require('gulp-yaml')
let clean = require('gulp-clean')
let jsoncombine = require("gulp-jsoncombine")
let VideoParser = require('./lib/video-parser')
let through = require('through2')
let utils = require('./lib/utils')
let camelCase = require('camelcase')
let path = require('path')
let fs = require('fs')
let tv4 = require('tv4')

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
		//
		.pipe(through.obj((file, encoding, callback) => {
			let relativePath = path.relative(__dirname + '/src', file.path)
			let dirname = path.dirname(relativePath)
			let schemaName
			if (dirname !== '.') {
				schemaName = dirname
			} else {
				schemaName = path.basename(relativePath, '.json')
			}

			fs.readFile(path.join(__dirname, 'schemas', `${schemaName}.json`), (err, data) => {
				if (err) {
					callback(err)
				}

				let schema = data.toString()
				let fileContents = file.contents.toString()
				let valid = tv4.validate(fileContents, schema)
				if (valid) {
					callback(null, file)
				} else {
					console.log('error')
					console.log(file.path)
					console.log(tv4.error.message)
					callback(tv4.error.message)
				}
			})
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
		.pipe(through.obj((file, encoding, callback) => {
			utils.populateVideos(JSON.parse(file.contents.toString()), videoParser)
				.then((result) => {
					file.contents = new Buffer(JSON.stringify(result))
					callback(null, file)
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