import { SCRIPT_NAME, SCRIPT_VERSION } from '../config/settings.js';

export function logInfo(...args) {
    console.log(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
}

export function logWarn(...args) {
    console.warn(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
}
