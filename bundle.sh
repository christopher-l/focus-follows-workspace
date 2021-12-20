#!/usr/bin/env bash

set -e

ZIP_FILE="focus-follows-workspace.zip"
FILES=("extension.js" "metadata.json")

rm "$ZIP_FILE" || true
zip "$ZIP_FILE" "${FILES[@]}"