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
				reject(`Parsing video: ${url}\nMessage: ${err}`)
			} else {
				let result = {
					id: videoInfo.id,
					url: videoInfo.embedSrc,
					title: videoInfo.name,
					thumbnail: videoInfo.thumb_url,
					lowResImage: videoInfo.lowResImage || '',
					normalImage: videoInfo.normalImage || '',
					highResImage: videoInfo.highResImage || ''
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
			let lowResImage = thumbnailImages && thumbnailImages.thumbnail
			let normalImage = thumbnailImages && (thumbnailImages.medium || thumbnailImages.medium_large || thumbnailImages.large || thumbnailImages.full)

	    	resolve({
	    		id: post.id,
	    		title: post.title,
	    		url,
	    		thumbnail: normalImage ? normalImage.url : '', // delete after client release
    			normalImage: normalImage ? normalImage.url : '',
    			lowResImage: lowResImage ? lowResImage.url : ''
	    	})
		})    
	})
}

function composeId(sourceObject, field, extension) {
	let fieldValue = sourceObject[field]
	let id = path.basename(fieldValue, extension)
	return Promise.resolve(Object.assign(sourceObject, {id}))
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

		let howToPromise = Promise.all(config.howTo.map(item => composeId(item, 'file', '.gif')))
		let guidePromise = Promise.all(config.guides.map(item => composeId(item, 'file', '.pdf')))

		// populate videos in use cases
		// todo use on any collection
		let useCasePromises = config.useCases.map(item => {
			let videos = item.videos || []
			let videoPromises = Promise.all(videos.map(videoUrl => parseVideo(parser, videoUrl)))
			let blogArticles = item.blogArticles || []
			let blogArticlePromises = Promise.all(blogArticles.map(blogArticleUrl => parseBlogArticle(blogArticleUrl)))
			let helpTopics = item.helpTopics || []
			let helpTopicsPromises = Promise.all(helpTopics.map(helpTopic => composeId(helpTopic, 'url')))

			return Promise.all([videoPromises, blogArticlePromises, helpTopicsPromises])
				.then(results => {
					item.videos = prepareVideos(results[0])
					item.blogArticles = results[1]
					item.helpTopics = results[2]
					return item
				})
		})

		// Getting started
		let gettingStartedPromises = config.gettingStarted.map(item => {
			let videos = item.videos || []
			let videoPromises = Promise.all(videos.map(videoUrl => parseVideo(parser, videoUrl)))
			let helpTopics = item.helpTopics || []
			let helpTopicsPromises = Promise.all(helpTopics.map(helpTopic => composeId(helpTopic, 'url')))
			let howTo = item.howTo || []
			let howToPromises = Promise.all(howTo.map(item => composeId(item, 'file', '.gif')))
			let guides = item.guides || []
			let guidesPromises = Promise.all(guides.map(item => composeId(item, 'file', '.pdf')))

			return Promise.all([videoPromises, helpTopicsPromises, howToPromises, guidesPromises])
				.then(results => {
					item.videos = prepareVideos(results[0])
					item.helpTopics = results[1]
					item.howTo = results[2]
					item.guides = results[3]
					return item
				})
		})

		let useCasePromise = Promise.all(useCasePromises)
		let gettingStartedPromise = Promise.all(gettingStartedPromises)

		Promise.all([videosPromise, useCasePromise, gettingStartedPromise, howToPromise, guidePromise])
			.then((results) => {
				config.videos = results[0]
				config.useCases = results[1]
				config.gettingStarted = results[2]
				config.howTo = results[3]
				config.guidePromise = results[4]
				resolve(config)
			})
			.catch(err => {
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