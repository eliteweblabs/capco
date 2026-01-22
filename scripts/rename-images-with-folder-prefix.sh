#!/bin/bash

# Script to prepend folder name to image files in public/img subdirectories

BASE_DIR="/Users/4rgd/Astro/rothcobuilt/public/img"

# Array of folders to process
folders=("Heroes" "Logos" "Project" "Services" "Supporting" "Team")

echo "Starting image renaming process..."
echo "=================================="

for folder in "${folders[@]}"; do
    folder_path="$BASE_DIR/$folder"
    
    if [ ! -d "$folder_path" ]; then
        echo "Warning: Folder $folder does not exist, skipping..."
        continue
    fi
    
    # Convert folder name to lowercase slug
    slug=$(echo "$folder" | tr '[:upper:]' '[:lower:]')
    
    echo ""
    echo "Processing folder: $folder (slug: $slug)"
    echo "----------------------------------------"
    
    # Find all files in the folder (not directories)
    find "$folder_path" -maxdepth 1 -type f | while read -r file; do
        # Get the filename without path
        filename=$(basename "$file")
        
        # Check if filename already starts with the slug
        if [[ "$filename" == "$slug-"* ]]; then
            echo "  Skipping (already prefixed): $filename"
            continue
        fi
        
        # New filename with slug prefix
        new_filename="${slug}-${filename}"
        new_path="$folder_path/$new_filename"
        
        # Rename the file
        mv "$file" "$new_path"
        echo "  Renamed: $filename -> $new_filename"
    done
done

echo ""
echo "=================================="
echo "Renaming complete!"
