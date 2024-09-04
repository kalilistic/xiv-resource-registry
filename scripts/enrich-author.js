#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { getAllYamlFiles, readYamlFile, writeYamlFile, sanitizeFileName } = require('./common');
const logger = require('./logger');

/**
 * Validates and extracts the GitHub username from the source URL using regex.
 *
 * @param {string} sourceUrl - The source URL from the YAML file.
 * @returns {string|null} - Returns the GitHub username if found, otherwise null.
 */
function extractGitHubUser(sourceUrl) {
    const githubMatch = sourceUrl.match(/^https:\/\/github\.com\/([^/]+)\/?/i);
    if (githubMatch) {
        return githubMatch[1];
    }
    return null;
}

/**
 * Updates the author YAML file to include the GitHub username if found.
 *
 * @param {string} authorName - The name of the author.
 * @param {string} ghUser - The GitHub username to add.
 */
function updateAuthorYaml(authorName, ghUser) {
    const sanitizedAuthorName = sanitizeFileName(authorName);
    const authorFilePath = path.join(__dirname, '../authors', `${sanitizedAuthorName}.yaml`);

    if (fs.existsSync(authorFilePath)) {
        const authorData = readYamlFile(authorFilePath);
        if (!authorData.gh_name) {
            authorData.gh_name = ghUser;
            writeYamlFile(authorFilePath, authorData);
            logger.info(`Updated author file with GitHub user: ${authorFilePath}`);
        }
    }
}

/**
 * Main function to enrich author information with GitHub usernames.
 */
function enrichAuthorsWithGitHub() {
    const yamlFiles = getAllYamlFiles(path.join(__dirname, '../resources'));
    let updatedCount = 0;

    yamlFiles.forEach(file => {
        const content = readYamlFile(file);
        if (content.author && typeof content.author === 'string') {
            const authorName = content.author;
            const sourceUrl = content.source_url || content.monorepo_url || content.plugin_master_url;

            if (sourceUrl) {
                const ghUser = extractGitHubUser(sourceUrl);
                if (ghUser) {
                    updateAuthorYaml(authorName, ghUser);
                    updatedCount++;
                }
            }
        }
    });

    if (updatedCount > 0) {
        logger.info(`Total authors enriched with GitHub usernames: ${updatedCount}`);
    } else {
        logger.info('No authors needed GitHub enrichment.');
    }
}

enrichAuthorsWithGitHub();
