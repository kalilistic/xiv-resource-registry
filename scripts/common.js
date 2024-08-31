const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Reads the contents of a directory and returns an array of file paths.
 *
 * @param {string} dir - The directory path to read.
 * @returns {string[]} - An array of resolved file paths.
 */
function readDirectory(dir) {
    return fs.readdirSync(dir).map(file => path.resolve(dir, file));
}

/**
 * Checks if a given path is a directory.
 *
 * @param {string} filePath - The path to check.
 * @returns {boolean} - True if the path is a directory, otherwise false.
 */
function isDirectory(filePath) {
    return fs.statSync(filePath).isDirectory();
}

/**
 * Recursively reads all YAML files in a directory.
 *
 * @param {string} dir - The directory to search.
 * @returns {string[]} - An array of paths to YAML files.
 */
function getAllYamlFiles(dir) {
    let files = [];
    const items = readDirectory(dir);
    items.forEach(item => {
        if (isDirectory(item)) {
            files = files.concat(getAllYamlFiles(item));
        } else if (item.endsWith('.yaml')) {
            files.push(item);
        }
    });
    return files;
}

/**
 * Sanitizes a file name by replacing spaces and underscores with hyphens,
 * but retains the file extension (e.g., .yaml).
 *
 * @param {string} name - The original name to sanitize.
 * @returns {string} - The sanitized name.
 */
function sanitizeFileName(name) {
    const ext = path.extname(name);
    const baseName = path.basename(name, ext);
    const sanitizedBaseName = baseName.toLowerCase()
        .replace(/[\s_]+/g, '-');

    return `${sanitizedBaseName}${ext}`;
}

/**
 * Reads and parses a YAML file.
 *
 * @param {string} filePath - Path to the YAML file.
 * @returns {Object} - Parsed YAML content.
 */
function readYamlFile(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    // noinspection JSCheckFunctionSignatures
    return yaml.load(fileContents);
}

/**
 * Writes an object to a YAML file.
 *
 * @param {string} filePath - Path to the YAML file.
 * @param {Object} data - Data to write to the file.
 */
function writeYamlFile(filePath, data) {
    // noinspection JSCheckFunctionSignatures
    const yamlStr = yaml.dump(data);
    fs.writeFileSync(filePath, yamlStr, 'utf8');
}

module.exports = {
    getAllYamlFiles,
    sanitizeFileName,
    readYamlFile,
    writeYamlFile
};
