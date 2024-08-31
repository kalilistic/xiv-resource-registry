const { yellow, green, red } = require('colorette');

/**
 * Logs an informational message in green.
 *
 * @param {string} message - The message to log.
 */
function info(message) {
    console.log(green(`[INFO] ${message}`));
}

/**
 * Logs a warning message in yellow.
 *
 * @param {string} message - The message to log.
 */
function warning(message) {
    console.warn(yellow(`[WARNING] ${message}`));
}

/**
 * Logs an error message in red.
 *
 * @param {string} message - The message to log.
 */
function error(message) {
    console.error(red(`[ERROR] ${message}`));
}

module.exports = {
    info,
    warning,
    error,
};
