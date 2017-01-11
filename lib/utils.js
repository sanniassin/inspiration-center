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

function prepareVideos(videos) {
	return videos
		.filter(video => video)
}

module.exports.populateVideos = (config, parser) => {
	return new Promise(resolve => {
		// populate videos collection
		let parsePromises = config.videos.map(video => parseVideo(parser, video))

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
			})
	})
}