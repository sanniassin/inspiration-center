#!/bin/bash
set -e

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
	echo "Travis should not deploy from pull requests"
  	exit 0
elif [ ! -f $SOURCE_DIR/config.json ]; then
	echo "No config file found"
  	exit 0
else
	if [ -n "$GITHUB_API_TOKEN" ]; then
		REPO=$(git config remote.origin.url)

		git clone -b ${TARGET_BRANCH} ${REPO} ${PUBLISH_DIR}

		if [ "$TRAVIS_BRANCH" == "$MASTER_BRANCH" ]; then 
			TARGET_DIR=$PUBLISH_DIR
		else
			TARGET_DIR=$PUBLISH_DIR/$TRAVIS_BRANCH
		fi
		
		rsync -r -f"- */" -f"+ *" --delete $SOURCE_DIR/ $TARGET_DIR/
		# to do // remove after client release
		rsync -r --delete $SOURCE_DIR/img/ $TARGET_DIR/img/
		rsync -r --delete $SOURCE_DIR/content/ $TARGET_DIR/content/
		cd $PUBLISH_DIR
		git config user.name "travis"
		git config user.email "travis"
		git add -A .
		git commit -m "$TRAVIS_COMMIT_MESSAGE"
		OWNER=`dirname $TRAVIS_REPO_SLUG`
		git push -f -q https://$OWNER:$GITHUB_API_TOKEN@github.com/$TRAVIS_REPO_SLUG $TARGET_BRANCH > /dev/null 2>&1
	fi
fi