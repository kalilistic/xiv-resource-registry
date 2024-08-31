#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getAllYamlFiles, readYamlFile, sanitizeFileName } = require('./common');
const logger = require('./logger');

/**
 * Renames files in the given directory according to fields in the YAML content.
 *
 * @param {string} dir - The directory to process.
 * @returns {number} - The number of files renamed.
 */
function renameFilesInDirectory(dir) {
    const files = getAllYamlFiles(dir);
    let renameCount = 0;

    files.forEach(file => {
        const yamlContent = readYamlFile(file);

        // Determine the base name for renaming, prioritizing short_name > name > author
        // noinspection JSUnresolvedReference
        let baseName = yamlContent.internal_name || yamlContent.short_name || yamlContent.name || yamlContent.author;

        if (baseName && typeof baseName === 'string') {
            const sanitizedBaseName = sanitizeFileName(baseName) + '.yaml';
            const currentFileName = path.basename(file);

            if (currentFileName !== sanitizedBaseName) {
                const newFilePath = path.join(path.dirname(file), sanitizedBaseName);
                fs.renameSync(file, newFilePath);
                logger.info(`Renamed ${file} to ${newFilePath}`);
                renameCount++;
            }
        } else {
            logger.warning(`No valid naming field found in ${file}. Skipping rename.`);
        }
    });

    return renameCount;
}

/**
 * Main function to rename files in the 'resources' and 'authors' directories.
 */
function renameFiles() {
    const directoriesToProcess = [
        path.join(__dirname, '../resources'),
        path.join(__dirname, '../authors'),
    ];

    let totalRenamedFiles = 0;

    directoriesToProcess.forEach(directory => {
        totalRenamedFiles += renameFilesInDirectory(directory);
    });

    if (totalRenamedFiles > 0) {
        logger.info(`Total files renamed: ${totalRenamedFiles}`);
    } else {
        logger.info('No files were renamed.');
    }
}

renameFiles();
