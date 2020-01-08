#!/usr/bin/env bash

# halt script on error
set -e 

# Rename compiled site folder to docs for use with GH-Pages
echo $PWD
mv _site/ docs/

# Credentials
git config user.email ${GITHUB_EMAIL}
git config user.name "caminek-travis"



git@github.com:caminek/caminek.github.io.git



# Push
git remote rm origin
git remote add origin https://TravisCI_Token:$GITHUB_TOKEN@github.com:caminek/caminek.github.io.git
git add .
git status
git commit -a -m "Travis #$TRAVIS_BUILD_NUMBER"
git push origin master
