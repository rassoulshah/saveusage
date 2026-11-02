#!/usr/bin/env fish
set -l project_dir (dirname (status --current-filename))
cd $project_dir

if not type -q node
    echo "Node.js >=22.13 is required."
    exit 1
end
if not type -q npm
    echo "npm is required."
    exit 1
end

npm install
or exit 1
npm run build
or exit 1
npm link
or exit 1
contextpilot init
contextpilot doctor
