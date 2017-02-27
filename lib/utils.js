'use strict';

let path = require('path')
let fs = require('fs')
let tv4 = require('tv4')
let request = require('request')
let keywordExtractor = require("keyword-extractor");

const BLOG_ARTICLES_API_URL = 'https://realtimeboard.com/blog/api/get_post/'
const BLOG_ARTICLES_API_PARAMS = {
	include: 'title,thumbnail'
}

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
					id: videoInfo.id,
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

function parseBlogArticle(url) {
	return new Promise((resolve, reject) => {
		let slug = path.basename(url)
		let queryString = Object.assign({slug}, BLOG_ARTICLES_API_PARAMS)
		let requestParams = {
			url: BLOG_ARTICLES_API_URL,
			qs: queryString
		}
		request(requestParams, function (err, res, body) {
		    if (err) {
		    	console.dir(err)
			    reject(err)
			    return
		    }

	    	var result = JSON.parse(body)
	    	let post = result.post
	    	if (!post) {
	    		console.log(`Blog articles API failed: ${slug}`)
    			reject(`Blog articles API failed: ${slug}`)
    			return
	    	}

	    	let thumbnailImages = post.thumbnail_images
	    	let thumbnail = thumbnailImages.medium || thumbnailImages.medium_large || thumbnailImages.large
	    	resolve({
	    		id: post.id,
	    		title: post.title,
	    		url,
	    		thumbnail: thumbnail ? thumbnail.url : ''
	    	})
		})    
	})
}

function parseHelpTopic(helpTopic) {
	let url = helpTopic.url
	let slug = path.basename(url)
	return Promise.resolve({
		id: slug,
		title: helpTopic.title,
		url: helpTopic.url
	})
}

// filter only successfully parsed videos
function prepareVideos(videos) {
	return videos
		.filter(video => video)
}

module.exports.populateData = (config, parser) => {
	return new Promise((resolve, reject) => {
		// populate videos collection
		let videoPromises = config.videos.map(video => parseVideo(parser, video, true))

		let videosPromise = Promise.all(videoPromises)
			.then(results => {
				return prepareVideos(results)
			})

		// populate videos in use cases
		// todo use on any collection
		let useCasePromises = config.useCases.map(useCase => {
			let useCaseVideos = useCase.videos || []
			let videoPromises = Promise.all(useCaseVideos.map(videoUrl => parseVideo(parser, videoUrl)))
			let useCaseBlogArticles = useCase.blogArticles || []
			let blogArticlePromises = Promise.all(useCaseBlogArticles.map(blogArticleUrl => parseBlogArticle(blogArticleUrl)))
			let useCaseHelpTopics = useCase.helpTopics || []
			let helpTopicsPromises = Promise.all(useCaseHelpTopics.map(helpTopic => parseHelpTopic(helpTopic)))

			return Promise.all([videoPromises, blogArticlePromises, helpTopicsPromises])
				.then(results => {
					useCase.videos = prepareVideos(results[0])
					useCase.blogArticles = results[1]
					useCase.helpTopics = results[2]
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
				console.log(`File path: ${filePath}`)
				console.log(`Path: ${tv4.error.dataPath}, Message: ${tv4.error.message}`)
				reject(`Path: ${tv4.error.dataPath}, Message: ${tv4.error.message}`)
			}
		})
	})
}