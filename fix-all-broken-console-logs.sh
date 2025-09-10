#!/bin/bash

# Script to fix all broken console.log statements that are causing syntax errors

echo "🔧 Fixing all broken console.log statements..."

# Find all TypeScript and Astro files
find src -name "*.ts" -o -name "*.astro" | while read file; do
    echo "Processing: $file"
    
    # Use sed to find and fix broken console.log statements
    # This fixes cases where console.log( is commented but the parameters are not
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file line by line
    in_broken_console=false
    brace_count=0
    
    while IFS= read -r line; do
        # Check if this line starts a broken console.log
        if [[ "$line" =~ ^[[:space:]]*//[[:space:]]*console\.log\( ]]; then
            echo "// $line" | sed 's|^// // |// |' >> "$temp_file"
            in_broken_console=true
            # Count opening braces/parentheses to track the structure
            brace_count=$(echo "$line" | tr -cd '(' | wc -c)
            brace_count=$((brace_count - $(echo "$line" | tr -cd ')' | wc -c)))
        elif [[ "$in_broken_console" == true ]]; then
            # We're inside a broken console.log block
            if [[ "$line" =~ ^[[:space:]]*// ]]; then
                # Line is already commented, keep it
                echo "$line" >> "$temp_file"
            else
                # Comment this line
                echo "// $line" >> "$temp_file"
            fi
            
            # Update brace count
            line_open=$(($(echo "$line" | tr -cd '(' | wc -c) + $(echo "$line" | tr -cd '{' | wc -c)))
            line_close=$(($(echo "$line" | tr -cd ')' | wc -c) + $(echo "$line" | tr -cd '}' | wc -c)))
            brace_count=$((brace_count + line_open - line_close))
            
            # If we've closed all braces, we're done with this console.log
            if [[ $brace_count -le 0 ]]; then
                in_broken_console=false
                brace_count=0
            fi
        else
            # Regular line, keep as is
            echo "$line" >> "$temp_file"
        fi
    done < "$file"
    
    # Replace the original file with the fixed version
    mv "$temp_file" "$file"
done

echo "✅ All broken console.log statements fixed!"
