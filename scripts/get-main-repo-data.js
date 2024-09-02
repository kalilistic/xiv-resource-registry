const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const yaml = require('js-yaml');

const PLUGIN_STATUS_ENUM = {
    ADOPTABLE: 'adoptable',
    STALE: 'stale',
    DISCONTINUED: 'discontinued',
    OBSOLETE: 'obsolete'
};

const DATA_JSON_URL = 'https://raw.githubusercontent.com/tommadness/Plugin-Browser/master/data.json';
const MAIN_REPO_PATH = path.join(__dirname, '..', 'resources', 'dalamud', 'repos', 'main-repo.yaml');

/**
 * Fetches the data.json file from the given URL.
 * @returns {Object} The parsed JSON data from the fetched file.
 */
async function fetchDataJson() {
    try {
        const response = await fetch(DATA_JSON_URL);
        if (!response.ok) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        logger.error(`Failed to fetch data.json: ${error}`);
        process.exit(1);
    }
}

/**
 * Validates that the fetched data.json contains the required properties.
 * @param {Object} data - The JSON data to validate.
 */
function validateDataJson(data) {
    // noinspection JSUnresolvedReference
    if (!data || !data.adoptable || !data.stale || !data.discontinued || !data.obsolete) {
        logger.error('data.json is missing required properties');
        process.exit(1);
    }
}

/**
 * Reads the main-repo.yaml file and parses it into an object.
 * @returns {Object} The parsed YAML data from the main-repo.yaml file.
 */
function readMainRepo() {
    try {
        const fileContent = fs.readFileSync(MAIN_REPO_PATH, 'utf8');
        return yaml.load(fileContent);
    } catch (error) {
        logger.error(`Failed to read main-repo.yaml: ${error}`);
        process.exit(1);
    }
}

/**
 * Writes the updated main-repo data back to the main-repo.yaml file.
 * @param {Object} mainRepoData - The updated data to write to the YAML file.
 */
function writeMainRepo(mainRepoData) {
    try {
        const yamlContent = yaml.dump(mainRepoData, { lineWidth: 100 });
        fs.writeFileSync(MAIN_REPO_PATH, yamlContent, 'utf8');
        logger.info('Updated main-repo.yaml successfully.');
    } catch (error) {
        logger.error(`Failed to write main-repo.yaml: ${error}`);
        process.exit(1);
    }
}

/**
 * Updates the plugin statuses in the main-repo.yaml based on the data from data.json.
 * Adds missing plugins and removes statuses for plugins not listed in data.json.
 * @param {Object} mainRepoData - The data from the main-repo.yaml file.
 * @param {Object} dataJson - The data from the data.json file.
 */
function updatePluginStatus(mainRepoData, dataJson) {
    const { adoptable, stale, discontinued, obsolete } = dataJson;
    const statusMaps = {
        [PLUGIN_STATUS_ENUM.ADOPTABLE]: adoptable,
        [PLUGIN_STATUS_ENUM.STALE]: stale,
        [PLUGIN_STATUS_ENUM.DISCONTINUED]: discontinued,
        [PLUGIN_STATUS_ENUM.OBSOLETE]: Object.keys(obsolete)
    };

    // Combine all plugin names from data.json into a single set for easy lookup
    const pluginStatusSet = new Set([...adoptable, ...stale, ...discontinued, ...Object.keys(obsolete)]);
    const plugins = mainRepoData.plugins || [];

    // Loop through each status type and update or add plugins in the main-repo.yaml
    for (const [status, pluginNames] of Object.entries(statusMaps)) {
        for (const pluginName of pluginNames) {
            const plugin = plugins.find(p => p.internal_name === pluginName);
            if (plugin) {
                plugin.plugin_status = status; // Update plugin status if it already exists
                if (status === PLUGIN_STATUS_ENUM.OBSOLETE) {
                    plugin.obsolete_reason = obsolete[pluginName];
                } else {
                    delete plugin.obsolete_reason;
                }
            } else {
                // Add the plugin if it doesn't exist in the main-repo.yaml
                const newPlugin = { internal_name: pluginName, plugin_status: status };
                if (status === PLUGIN_STATUS_ENUM.OBSOLETE) {
                    newPlugin.obsolete_reason = obsolete[pluginName];
                }
                plugins.push(newPlugin);
            }
        }
    }

    // Remove plugin_status and obsolete_reason from plugins not listed in data.json
    for (const plugin of plugins) {
        if (plugin.plugin_status && !pluginStatusSet.has(plugin.internal_name)) {
            delete plugin.plugin_status;
            delete plugin.obsolete_reason; // Ensure obsolete_reason is removed if not obsolete
        }
    }

    // Sort plugins alphabetically by internal_name for consistency
    mainRepoData.plugins = plugins.sort((a, b) => a.internal_name.localeCompare(b.internal_name));
}

/**
 * Main function to orchestrate the fetching, validation, updating, and writing of repo data.
 */
async function main() {
    const dataJson = await fetchDataJson();
    validateDataJson(dataJson);

    const mainRepoData = readMainRepo();

    updatePluginStatus(mainRepoData, dataJson);

    writeMainRepo(mainRepoData);
}

// Execute the main function and handle any unexpected errors
main().catch(error => {
    logger.error(`An unexpected error occurred: ${error}`);
    process.exit(1);
});
