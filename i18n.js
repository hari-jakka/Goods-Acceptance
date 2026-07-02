const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'webapp'); // Replace with the path to your UI5 app
const i18nFilePath = path.join(__dirname, 'webapp', 'i18n', 'i18n.properties'); // Path to your i18n.properties file

const keys = new Set();

// Function to read files recursively
function readFilesRecursively(dir) {
    fs.readdirSync(dir).forEach(file => {
        const newPath = path.join(dir, file);
        if (fs.statSync(newPath).isDirectory()) {
            readFilesRecursively(newPath);
        } else if (file.endsWith('.xml')) { // Searching only XML files for i18n references
            const data = fs.readFileSync(newPath, 'utf8');
            const matches = data.match(/{i18n>([^}]+)}/g);
            if (matches) {
                matches.forEach(match => {
                    const key = match.match(/{i18n>([^}]+)}/)[1];
                    keys.add(key); // Collect unique keys
                });
            }
        }
    });
}

// Start reading files from the specified UI5 project directory
readFilesRecursively(directoryPath);

// Read existing keys from the i18n.properties file (if it exists)
let existingKeys = new Set();
if (fs.existsSync(i18nFilePath)) {
    const existingData = fs.readFileSync(i18nFilePath, 'utf8');
    existingData.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=/);
        if (match) {
            existingKeys.add(match[1]); // Collect existing keys without their values
        }
    });
}

// Prepare the i18n.properties file content
let i18nContent = '';

// Add new keys only if they do not already exist
keys.forEach(key => {
    if (!existingKeys.has(key)) {
        i18nContent += `${key}=\n`; // Add new key with placeholder for the value
    }
});

// Append the new keys to the existing properties file if any new keys were found
if (i18nContent) {
    fs.appendFileSync(i18nFilePath, i18nContent, 'utf8');
    console.log('New i18n keys extracted and added to i18n.properties');
} else {
    console.log('No new i18n keys found to add.');
}