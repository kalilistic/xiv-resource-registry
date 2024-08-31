#!/usr/bin/env node

const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const path = require('path');
const { getAllYamlFiles, readYamlFile } = require('./common');
const { info, error } = require('./logger');
const { readFileSync } = require('node:fs');

/**
 * Creates and configures a new Ajv instance for JSON schema validation.
 *
 * @returns {Ajv} - The configured Ajv instance with formats added.
 */
function createAjvInstance() {
    const ajv = new Ajv({
        strict: true,
        strictRequired: false,
        allErrors: true,
    });
    addFormats(ajv);
    return ajv;
}

/**
 * Loads and registers JSON schemas into the given Ajv instance.
 *
 * @param {Ajv} ajvInstance - The Ajv instance to register schemas with.
 * @param {Array<{ schemaPath: string, schemaId: string }>} schemas - An array of objects containing schema paths and IDs.
 */
function registerSchemas(ajvInstance, schemas) {
    schemas.forEach(({ schemaPath, schemaId }) => {
        const schema = JSON.parse(readFileSync(path.resolve(__dirname, schemaPath), 'utf8'));
        ajvInstance.addSchema(schema, schemaId);
    });
}

/**
 * Validates all YAML files in the specified directory against the provided JSON schema.
 *
 * @param {string} directory - The directory path to search for YAML files.
 * @param {string} schemaId - The ID of the schema to validate against.
 * @param {Ajv} ajvInstance - The Ajv instance to use for validation.
 */
function validateYamlFiles(directory, schemaId, ajvInstance) {
    const files = getAllYamlFiles(path.resolve(__dirname, directory));
    const validate = ajvInstance.getSchema(schemaId);

    let errorCount = 0;
    files.forEach(file => {
        const data = readYamlFile(file);
        if (!validate(data)) {
            errorCount++;
            error(`${file} is invalid against ${schemaId}:`);
            console.log(validate.errors);
        }
    });

    if (errorCount === 0) {
        info(`All files in ${directory} are valid against ${schemaId}.`);
    } else {
        error(`${errorCount} file(s) in ${directory} are invalid against ${schemaId}.`);
    }
}

/**
 * Executes the schema validation process for all relevant directories and schemas.
 */
function runSchemaValidation() {
    const ajv = createAjvInstance();
    registerSchemas(ajv, [
        { schemaPath: '../schemas/author-schema.json', schemaId: 'author-schema.json' },
        { schemaPath: '../schemas/framework-schema.json', schemaId: 'framework-schema.json' },
        { schemaPath: '../schemas/desktop-app-schema.json', schemaId: 'desktop-app-schema.json' },
        { schemaPath: '../schemas/dev-tool-schema.json', schemaId: 'dev-tool-schema.json' },
        { schemaPath: '../schemas/web-schema.json', schemaId: 'web-schema.json' },
        { schemaPath: '../schemas/act-overlay-schema.json', schemaId: 'act-overlay-schema.json' },
        { schemaPath: '../schemas/act-plugin-schema.json', schemaId: 'act-plugin-schema.json' },
        { schemaPath: '../schemas/dalamud-repo-schema.json', schemaId: 'dalamud-repo-schema.json' },
        { schemaPath: '../schemas/dalamud-plugin-schema.json', schemaId: 'dalamud-plugin-schema.json' },
    ]);

    validateYamlFiles('../authors', 'author-schema.json', ajv);
    validateYamlFiles('../resources/frameworks', 'framework-schema.json', ajv);
    validateYamlFiles('../resources/desktop', 'desktop-app-schema.json', ajv);
    validateYamlFiles('../resources/dev-tools', 'dev-tool-schema.json', ajv);
    validateYamlFiles('../resources/web', 'web-schema.json', ajv);
    validateYamlFiles('../resources/act/overlays', 'act-overlay-schema.json', ajv);
    validateYamlFiles('../resources/act/plugins', 'act-plugin-schema.json', ajv);
    validateYamlFiles('../resources/dalamud/repos', 'dalamud-repo-schema.json', ajv);
    validateYamlFiles('../resources/dalamud/plugins', 'dalamud-plugin-schema.json', ajv);
}

// Start the schema validation process.
runSchemaValidation();
