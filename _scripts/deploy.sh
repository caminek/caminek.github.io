#!/usr/bin/env bash

# halt script on error
set -e 

# Grab blog files
echo "Cloning blog"
git clone https://github.com/caminek/caminek.github.io.git /home/travis/build/caminek/blog

# Remove old files
cd /home/travis/build/caminek/blog

echo "Removing files from blog"
rm -rf *

# Copy in new files
echo "Copying compiled site to blog"
cp -r /home/travis/build/caminek/ghpages/_site/* /home/travis/build/caminek/blog

# Credentials
echo "Setting GH Crredentials"
git config user.email ${GITHUB_EMAIL}
git config user.name "caminek-travisci"

# Push
echo "Pushing blog to GitHub"
git add .
git status
git commit -a -m "Travis #$TRAVIS_BUILD_NUMBER"
git push -f -q https://${GITHUB_TOKEN}@github.com/caminek/caminek.github.io.git master
