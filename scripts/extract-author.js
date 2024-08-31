#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { getAllYamlFiles, readYamlFile, writeYamlFile, sanitizeFileName } = require('./common');
const logger = require('./logger');

/**
 * Creates an author file based on the author name if it doesn't already exist.
 *
 * @param {string} authorName - The name of the author.
 * @returns {boolean} - Returns true if a new author file was created.
 */
function saveAuthorData(authorName) {
    const sanitizedAuthorName = sanitizeFileName(authorName);
    const authorFilePath = path.join(__dirname, '../authors', `${sanitizedAuthorName}.yaml`);

    if (!fs.existsSync(authorFilePath)) {
        const authorData = { name: authorName };
        writeYamlFile(authorFilePath, authorData);
        logger.info(`Created author file: ${authorFilePath}`);
        return true;
    }
    return false;
}

/**
 * Main function to extract and save author information.
 */
function extractAuthorsFromYaml() {
    const yamlFiles = getAllYamlFiles(path.join(__dirname, '../resources'));
    let createdCount = 0;

    yamlFiles.forEach(file => {
        const content = readYamlFile(file);
        // noinspection JSUnresolvedReference
        if (content.author && typeof content.author === 'string') {
            if (saveAuthorData(content.author)) {
                createdCount++;
            }
        }
    });

    if (createdCount > 0) {
        logger.info(`Total new authors created: ${createdCount}`);
    } else {
        logger.info('No new authors needed to be created.');
    }
}

extractAuthorsFromYaml();
