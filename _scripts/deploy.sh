#!/usr/bin/env bash

# halt script on error
set -e 

# Rename compiled site folder to docs for use with GH-Pages
echo $PWD
mv _site/ docs/

# Credentials
git config user.email ${GITHUB_EMAIL}
git config user.name "caminek-travis"

# Push
git add .
git status
git commit -a -m "Travis #$TRAVIS_BUILD_NUMBER"
git push "https://${GITHUB_TOKEN}@github.com:caminek/caminek.github.io.git" master
