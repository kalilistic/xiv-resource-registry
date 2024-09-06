#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { getAllYamlFiles, readYamlFile, writeYamlFile, sanitizeFileName } = require('./common');
const logger = require('./logger');

/**
 * Dynamically imports node-fetch to avoid ES Module issues.
 */
async function importFetch() {
    return await import('node-fetch');
}

/**
 * Fetches GitHub user data using the GitHub API.
 *
 * @param {string} username - The GitHub username to fetch data for.
 * @returns {Promise<Object|null>} - Returns the GitHub user data if found, otherwise null.
 */
async function fetchGitHubUserData(username) {
    const { default: fetch } = await importFetch();
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            logger.error(`Failed to fetch GitHub data for ${username}: ${response.statusText}`);
            return null;
        }
    } catch (error) {
        logger.error(`Error fetching GitHub user data for ${username}: ${error.message}`);
        return null;
    }
}

/**
 * Updates the author YAML file with GitHub username and user ID.
 *
 * @param {string} authorName - The name of the author.
 * @param {string} ghUser - The GitHub username to add.
 * @param {string} ghId - The GitHub user ID to add.
 */
function updateAuthorYaml(authorName, ghUser, ghId) {
    const sanitizedAuthorName = sanitizeFileName(authorName);
    const authorFilePath = path.join(__dirname, '../authors', `${sanitizedAuthorName}.yaml`);

    if (fs.existsSync(authorFilePath)) {
        const authorData = readYamlFile(authorFilePath);

        if (!authorData.gh_name) {
            authorData.gh_name = ghUser;
        }
        if (!authorData.gh_id) {
            authorData.gh_id = ghId;
        }

        writeYamlFile(authorFilePath, authorData);
        logger.info(`Updated author file with GitHub user: ${authorFilePath}`);
    }
}

/**
 * Main function to enrich author information with GitHub usernames and IDs.
 */
async function enrichAuthorsWithGitHub() {
    const yamlFiles = getAllYamlFiles(path.join(__dirname, '../resources'));
    let updatedCount = 0;

    for (const file of yamlFiles) {
        const content = readYamlFile(file);

        // noinspection JSUnresolvedReference
        if (content.author && typeof content.author === 'string') {
            const authorName = content.author;
            const authorFilePath = path.join(__dirname, '../authors', `${sanitizeFileName(authorName)}.yaml`);

            if (fs.existsSync(authorFilePath)) {
                const authorData = readYamlFile(authorFilePath);

                if (authorData.gh_name) {
                    if (!authorData.gh_id) {
                        // Fetch GitHub data to get the user ID
                        const ghUser = authorData.gh_name;
                        const userData = await fetchGitHubUserData(ghUser);

                        if (userData && userData.id) {
                            updateAuthorYaml(authorName, ghUser, userData.id);
                            updatedCount++;
                        }
                    } else {
                        logger.info(`Skipped author (gh_id already set): ${authorName}`);
                    }
                } else {
                    logger.info(`Skipped author (gh_name not set): ${authorName}`);
                }
            }
        }
    }

    logger.info(`Total authors enriched with GitHub IDs: ${updatedCount}`);
}

enrichAuthorsWithGitHub();
