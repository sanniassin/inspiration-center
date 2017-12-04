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
let frontMatter = require('front-matter')
let marked = require('marked');
const merge2 = require('merge2')

gulp.task('clean', function() {
  return gulp.src(['dist'], {read: false})
    .pipe(clean());
});

gulp.task('compile', ['clean'], function(youtube, vimeo) {
	let videoParser = null
	if (youtube || vimeo) {
		videoParser = new VideoParser({
		    youtube: {
		        key: youtube
		    },
		    vimeo: {
		        access_token: vimeo
		    },
		    disableCache: true
		})
	}

	let renderer = new marked.Renderer()
	renderer.link = (href, title, text) => {
		let targetAttr = ''
		if (href.startsWith('https://')) {
			targetAttr = ' target="_blank"'
		}
		
		return `<a href=${href}${targetAttr}>${text}</a>`
	}

	let markdownFiles = gulp.src('./src/**/*.md')
		// compile markdown
		.pipe(through.obj((file, encoding, callback) => {
			if (/(readme|README).md$/.test(file.path)) {
				callback()
			} else {	
				let content = frontMatter(file.contents.toString())
				let result = {
					...content.attributes,
					body: marked(content.body, { renderer })
				}
				file.contents = new Buffer(JSON.stringify(result))
				file.path = file.path.replace(/\.md$/, '.json')
				path.basename(file.path)
				callback(null, file)
			}
		}))

	let yamlFiles = gulp.src('./src/**/*.yml')
		// compile YAML to JSON
		.pipe(yaml({
			safe: true,
			space: 2
		}))
		// validate JSON schemas
		// .pipe(through.obj((file, encoding, callback) => {
		// 	utils.validateJSON(file.path, file.contents)
		// 		.then(() => {
		// 			callback(null, file)
		// 		})
		// }))

	merge2([markdownFiles, yamlFiles])
		// concat JSON files in to one
		.pipe(jsoncombine('config.json', utils.combineByPath))
		// get video meta
		.pipe(through.obj((file, encoding, callback) => {
			utils.prepareData(JSON.parse(file.contents.toString()), videoParser)
				.then((result) => {
					file.contents = new Buffer(JSON.stringify(result))
					callback(null, file)
				})
				.catch((err) => {
					console.log(err)
					throw new Error(err)
				})
		}))
		.pipe(gulp.dest('./dist'));
})

gulp.task('content', ['clean'], function() {
	return gulp.src(['./content/**/*'])
		.pipe(gulp.dest('./dist/content'))
})

gulp.task('build', ['compile', 'content'])

gulp.task('watch', function() {
	gulp.watch(['./src/**/*', 'gulpfile.js'], ['build'])
})

gulp.task('default', ['build']);