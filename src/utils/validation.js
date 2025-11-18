/**
 * Validation utilities for file uploads and input data
 */

import { CONSTANTS, UI_TEXT } from './constants.js';

/**
 * Validates an uploaded file
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateFile(file) {
    if (!file) {
        return { valid: false, error: UI_TEXT.errors.noFile };
    }

    // Check file size
    if (file.size > CONSTANTS.MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: UI_TEXT.errors.fileTooLarge };
    }

    // Check file type and extension
    const isValidType = CONSTANTS.VALID_IMAGE_TYPES.includes(file.type);
    const isValidExtension = CONSTANTS.VALID_IMAGE_EXTENSIONS.some(ext =>
        file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType && !isValidExtension) {
        return { valid: false, error: UI_TEXT.errors.invalidType };
    }

    return { valid: true };
}

/**
 * Validates a date string
 * @param {string} dateString - Date string to validate
 * @returns {{valid: boolean, date?: Date}} Validation result with parsed date
 */
export function validateDate(dateString) {
    if (!dateString || !dateString.trim()) {
        return { valid: false };
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateString);
        return { valid: false };
    }

    return { valid: true, date };
}

/**
 * Checks if a file is HEIC/HEIF format
 * @param {File} file - The file to check
 * @returns {boolean} True if file is HEIC/HEIF
 */
export function isHeicFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif');
}

/**
 * Validates DOM elements exist
 * @param {Object} elementMap - Map of element IDs to element references
 * @returns {{valid: boolean, missing?: string[]}} Validation result
 */
export function validateElements(elementMap) {
    const missing = Object.entries(elementMap)
        .filter(([_, element]) => !element)
        .map(([id, _]) => id);

    if (missing.length > 0) {
        return { valid: false, missing };
    }

    return { valid: true };
}
