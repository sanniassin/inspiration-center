'use strict';

function parseVideo(parser, url) {
	return new Promise(resolve => {
		parser.parse((err, videoInfo) => {
			if (err) {
				console.log(`Error parsing video: ${url}`)
				console.dir(err)
				resolve(null)
			} else {
				resolve({
					url: videoInfo.embedSrc,
					title: videoInfo.name,
					thumbnail: videoInfo.thumb_url,
				})
			}
		}, url)
	})
}

function applyParseResult(video, parseResult) {
	if (!parseResult) {
		return null
	}

	return Object.assign(video, parseResult)
}

function prepareVideos(videos) {
	return videos
		.filter(video => video)
}

module.exports.populateVideos = (config, parser) => {
	return new Promise(resolve => {
		// populate videos collection
		let parsePromises = config.videos.map(video => {
			return parseVideo(parser, video.url)
				.then(parseResult => applyParseResult.call(null, video, parseResult))
		})

		let videosPromise = Promise.all(parsePromises)
			.then(results => {
				return prepareVideos(results)
			})

		// populate videos in categories
		let categoriesPromises = config.categories.map(category => {
			if (!category.videos) {
				return Promise.resolve(category)
			}

			let parsePromises = category.videos.map(videoUrl => parseVideo(parser, videoUrl))

			return Promise.all(parsePromises)
				.then(results => {
					category.videos = prepareVideos(results)
					return category
				})
		})

		let categoriesPromise = Promise.all(categoriesPromises)

		Promise.all([videosPromise, categoriesPromise])
			.then((results) => {
				config.videos = results[0]
				config.categories = results[1]
				resolve(config)
			})
			.catch(err => {
				console.log(err)
			})
	})
}