#!/usr/bin/env bash

set -e # halt script on error

npm install -g gulp-cli 
bundle install
npm install
gulp
bundle exec htmlproofer ./_site --disable-external
