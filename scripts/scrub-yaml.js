#!/usr/bin/env node

const path = require('path');
const { getAllYamlFiles, readYamlFile, writeYamlFile } = require('./common');
const { info, error } = require('./logger');

/**
 * Recursively removes trailing slashes from URLs in the given object.
 *
 * @param {Object} obj - The object to process.
 */
function removeTrailingSlashesFromUrls(obj) {
    Object.keys(obj).forEach(key => {
        const value = obj[key];

        if (typeof value === 'string' && value.startsWith('http')) {
            // Remove trailing slash if present
            if (value.endsWith('/')) {
                obj[key] = value.slice(0, -1);
                console.log(`Updated URL: ${obj[key]}`);
            }
        } else if (typeof value === 'object' && value !== null) {
            // Recursively process nested objects
            removeTrailingSlashesFromUrls(value);
        }
    });
}

/**
 * Processes all YAML files in the specified directory by removing trailing slashes from URLs.
 *
 * @param {string} directory - The directory path to search for YAML files.
 */
function processYamlFiles(directory) {
    const files = getAllYamlFiles(path.resolve(__dirname, directory));

    files.forEach(file => {
        try {
            let content = readYamlFile(file);

            // Remove trailing slashes from URLs
            const originalContent = JSON.stringify(content);
            removeTrailingSlashesFromUrls(content);

            // Write the updated content back to the file if changes were made
            if (originalContent !== JSON.stringify(content)) {
                writeYamlFile(file, content);
                info(`Updated ${file}: removed trailing slashes from URLs.`);
            } else {
                info(`${file} already has clean URLs.`);
            }
        } catch (err) {
            error(`Failed to process ${file}: ${err.message}`);
        }
    });
}

/**
 * Runs the process for both the resources and authors directories.
 */
function runProcess() {
    processYamlFiles('../authors');
    processYamlFiles('../resources');
}

// Start the URL cleaning process
runProcess();
