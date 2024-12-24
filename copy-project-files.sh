#!/bin/bash

# Script to copy files to copy-project-files in a flat structure
# Usage: ./copy-project-files.sh

# Set target directory
TARGET_DIR="./copy-project-files"

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creating directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
else
    echo "Clearing existing directory: $TARGET_DIR"
    rm -rf "$TARGET_DIR"/*
fi

# Find and copy files, excluding unwanted directories, into a flat structure
find . -type f \( \
    ! -path '*/node_modules/*' \
    -a ! -path '*/lambda-package/*' \
    -a ! -path '*/openai_layer/*' \
    -a ! -path '*/.git/*' \
    -a ! -path "$TARGET_DIR/*" \
    \) -exec bash -c '
        # Get just the filename without path
        filename=$(basename "{}")
        # If there are duplicate filenames, append a number
        if [ -e "'$TARGET_DIR'/$filename" ]; then
            counter=1
            while [ -e "'$TARGET_DIR'/$filename.$counter" ]; do
                counter=$((counter + 1))
            done
            cp "{}" "'$TARGET_DIR'/$filename.$counter"
        else
            cp "{}" "'$TARGET_DIR'/$filename"
        fi
    ' \;

echo "Files have been copied to $TARGET_DIR"

# Print summary of copied files
echo -e "\nFiles copied:"
ls -1 "$TARGET_DIR" | sort