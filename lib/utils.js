'use strict';

let path = require('path')
let fs = require('fs')
let tv4 = require('tv4')
let keywordExtractor = require("keyword-extractor");

const KEYWORD_EXTRACTOR_CONFIG = {
	language:"english",
    remove_digits: true,
    return_changed_case:true,
    remove_duplicates: true
}

function getKeywords(sentences) {
	if (!sentences || !sentences.length) {
		return []
	}

	let sentence = sentences.join(' ')
	let result = keywordExtractor.extract(sentence, KEYWORD_EXTRACTOR_CONFIG)
	return result
}

function parseVideo(parser, url, getTags) {
	return new Promise((resolve, reject) => {
		parser.parse((err, videoInfo) => {
			if (err) {
				console.log(err)
				reject(`Parsing video: ${url}\nMessage: ${err}`)
			} else {
				let result = {
					url: videoInfo.embedSrc,
					title: videoInfo.name,
					thumbnail: videoInfo.thumb_url
				}
				if (getTags) {
					result.tags = getKeywords([videoInfo.name, videoInfo.desc])
				}
				resolve(result)
			}
		}, url)
	})
}

// filter only successfully parsed videos
function prepareVideos(videos) {
	return videos
		.filter(video => video)
}

module.exports.populateVideos = (config, parser) => {
	return new Promise((resolve, reject) => {
		// populate videos collection
		let parsePromises = config.videos.map(video => parseVideo(parser, video, true))

		let videosPromise = Promise.all(parsePromises)
			.then(results => {
				return prepareVideos(results)
			})

		// populate videos in use cases
		// todo use on any collection
		let useCasePromises = config.useCases.map(useCase => {
			if (!useCase.videos) {
				return Promise.resolve(useCase)
			}

			let parsePromises = useCase.videos.map(videoUrl => parseVideo(parser, videoUrl))

			return Promise.all(parsePromises)
				.then(results => {
					useCase.videos = prepareVideos(results)
					return useCase
				})
		})

		let useCasePromise = Promise.all(useCasePromises)

		Promise.all([videosPromise, useCasePromise])
			.then((results) => {
				config.videos = results[0]
				config.useCases = results[1]
				resolve(config)
			})
			.catch(err => {
				console.log(err)
				reject(err)
			})
	})
}

module.exports.validateJSON = (filePath, fileContents) => {
	return new Promise((resolve, reject) => {
		let cwd = process.cwd()
		let relativePath = path.relative(cwd + '/src', filePath)
		let dirname = path.dirname(relativePath)
		let schemaName
		if (dirname !== '.') {
			schemaName = dirname
		} else {
			schemaName = path.basename(relativePath, '.json')
		}

		fs.readFile(path.join(cwd, 'schemas', `${schemaName}.json`), (err, data) => {
			if (err) {
				reject(err)
			}

			let schema = JSON.parse(data.toString())
			let contents = JSON.parse(fileContents.toString())
			let valid = tv4.validate(contents, schema)

			if (valid) {
				if (tv4.missing && tv4.missing.length) {
					reject(`Missing schemas: ${JSON.stringify(tv4.missing)}`)
				} else {
					resolve()
				}
			} else {
				reject(`Path: ${tv4.error.dataPath}, Message: ${tv4.error.message}`)
			}
		})
	})
}