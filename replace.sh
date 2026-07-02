#!/bin/bash

# Function to replace strings inside XML files based on CSV input
replace_strings_in_xml() {
    local csv_file="$1"
    
    # Read the CSV file line by line
    while IFS=';' read -r old_str new_str; do
        # Skip the header row if your CSV has headers (uncomment the next line)
        # [ "$old_str" == "old_string_column" ] && continue

        # Find and replace in XML files
        for xml_file in *.xml; do
            if [[ -f "$xml_file" ]]; then
                # Check if the line contains a key that starts with i18n>
                if grep -q "i18n>${old_str}" "$xml_file"; then
                    # Use sed to replace the strings while handling newlines properly
                    # -i option makes the change in place, and | as a delimiter helps avoid issues with slashes
                    sed -i "s|{i18n>${old_str}}|{i18n>${new_str}}|g" "$xml_file"
                    echo "Replaced \"i18n>${old_str}\" with \"i18n>${new_str}\" in \"$xml_file\""
                fi
            fi
        done
    done < "$csv_file"
}

# Check for the CSV file path
if [ $# -ne 1 ]; then
    echo "Usage: $0 path_to_your_file.csv"
    exit 1
fi

# Call the function with the provided CSV file
replace_strings_in_xml "$1"