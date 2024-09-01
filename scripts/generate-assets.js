const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const archiver = require('archiver');
const logger = require('./logger');

const schemaDirs = {
    authors: path.resolve(__dirname, '../authors'),
    act_plugins: path.resolve(__dirname, '../resources/act/plugins'),
    act_overlays: path.resolve(__dirname, '../resources/act/overlays'),
    dalamud_plugins: path.resolve(__dirname, '../resources/dalamud/plugins'),
    dalamud_repos: path.resolve(__dirname, '../resources/dalamud/repos'),
    desktop: path.resolve(__dirname, '../resources/desktop'),
    dev_tools: path.resolve(__dirname, '../resources/dev-tools'),
    frameworks: path.resolve(__dirname, '../resources/frameworks'),
    web: path.resolve(__dirname, '../resources/web'),
};
const outputDir = path.resolve(__dirname, '../artifacts');

/**
 * Get the current version of the package.
 * @returns {string}
 */
function getVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    const version = packageJson.version;
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    return `${version}-${commitHash}`;
}

/**
 * Merge JSON data into a single file by schema.
 * @param schema
 * @param data
 * @param subDir
 */
function mergeJsonBySchema(schema, data, subDir = '') {
    const jsonFileName = `${schema}${subDir ? `_${subDir}` : ''}.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);

    let combinedData = [];
    if (fs.existsSync(jsonFilePath)) {
        combinedData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    }

    combinedData.push(...data);
    fs.writeFileSync(jsonFilePath, JSON.stringify(combinedData, null, 2));
    logger.info(`Merged JSON data for schema: ${schema}${subDir ? ` in subdir: ${subDir}` : ''}`);
}

/**
 * Process all YAML files and merge them into JSON files by schema.
 */
function processYamlFiles() {
    for (const [schema, dir] of Object.entries(schemaDirs)) {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            const combinedData = [];

            if (fs.statSync(filePath).isDirectory()) {
                const subDirName = path.basename(filePath);
                fs.readdirSync(filePath).forEach(subFile => {
                    const subFilePath = path.join(filePath, subFile);
                    if (subFilePath.endsWith('.yaml')) {
                        const content = fs.readFileSync(subFilePath, 'utf8');
                        // noinspection JSCheckFunctionSignatures
                        const data = yaml.load(content);
                        combinedData.push(data);
                    }
                });

                if (combinedData.length > 0) {
                    mergeJsonBySchema(schema, combinedData, subDirName);
                }
            } else if (filePath.endsWith('.yaml')) {
                const content = fs.readFileSync(filePath, 'utf8');
                // noinspection JSCheckFunctionSignatures
                const data = yaml.load(content);
                combinedData.push(data);
            }

            if (combinedData.length > 0 && !fs.statSync(filePath).isDirectory()) {
                mergeJsonBySchema(schema, combinedData);
            }
        });
    }
}


/**
 * Create a ZIP archive of the specified directories.
 * @param dirPaths
 * @param archiveName
 * @returns {Promise<unknown>}
 */
/**
 * Create a ZIP archive of the specified directories.
 * @param dirPaths
 * @param archiveName
 * @returns {Promise<unknown>}
 */
function createArchive(dirPaths, archiveName) {
    const outputPath = path.join(outputDir, archiveName);
    const output = fs.createWriteStream(outputPath);
    // noinspection JSCheckFunctionSignatures
    const zip = archiver('zip');

    zip.pipe(output);

    dirPaths.forEach(dirPath => {
        if (fs.statSync(dirPath).isDirectory()) {
            // Recursively add directories and their contents, preserving structure
            // noinspection JSCheckFunctionSignatures
            zip.directory(dirPath, path.relative(path.resolve(__dirname, '../resources'), dirPath));
        } else {
            zip.file(dirPath, { name: path.basename(dirPath) });
        }
    });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            logger.info(`Created archive: ${outputPath}`);
            resolve(outputPath);
        });

        zip.on('error', (err) => {
            reject(err);
        });

        // noinspection JSIgnoredPromiseFromCall
        zip.finalize();
    });
}

/**
 * Generate release assets for the current version.
 * @returns {Promise<{jsonArchive: *, yamlArchive: *, version: string}>}
 */
async function generateReleaseAssets() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const version = getVersion();

    // Process and merge YAML files into JSON by schema
    processYamlFiles();

    // Collect all JSON files
    const jsonFiles = fs.readdirSync(outputDir).map(file => path.join(outputDir, file)).filter(file => file.endsWith('.json'));
    const jsonArchive = await createArchive(jsonFiles, `json-files.zip`);

    // Create YAML archive with full folder structure
    const yamlArchive = await createArchive(Object.values(schemaDirs), `yaml-files.zip`);

    // Clean up loose JSON files
    jsonFiles.forEach(file => fs.unlinkSync(file));

    return { jsonArchive, yamlArchive, version };
}

/**
 * Main function to generate release assets.
 */
generateReleaseAssets()
    .then(({ jsonArchive, yamlArchive, version }) => {
        console.log(`::set-output name=json_archive::${jsonArchive}`);
        console.log(`::set-output name=yaml_archive::${yamlArchive}`);
        console.log(`::set-output name=version::${version}`);
    })
    .catch(err => {
        logger.error(`Error generating release assets: ${err.message}`);
        process.exit(1);
    });
