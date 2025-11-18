/**
 * Formatting utilities for dates, filenames, and display text
 */

import { CONSTANTS } from './constants.js';
import { validateDate } from './validation.js';

/**
 * Formats a date from YYYY-MM-DD to DD.MM.YY
 * @param {string} dateValue - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(dateValue) {
    if (!dateValue) return '';

    const validation = validateDate(dateValue);
    if (!validation.valid) return '';

    const date = validation.date;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${day}.${month}.${year}`;
}

/**
 * Formats date and time into display string
 * @param {Object} params - Formatting parameters
 * @param {string} params.dateValue - Date value (YYYY-MM-DD)
 * @param {string} params.startTime - Start time (HH:MM)
 * @param {string} params.endTime - End time (HH:MM)
 * @returns {string} Formatted date/time string
 */
export function formatDateTime({ dateValue, startTime, endTime }) {
    const dateText = formatDate(dateValue);
    const start = startTime?.trim() || '';
    const end = endTime?.trim() || '';

    if (dateText) {
        if (start && end) {
            return `${dateText}｜${start}-${end}`;
        } else if (start) {
            return `${dateText}｜${start}`;
        }
        return dateText;
    } else if (start && end) {
        return `${start}-${end}`;
    } else if (start) {
        return start;
    }

    return '';
}

/**
 * Sanitizes a string for use in filenames
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length for result
 * @returns {string} Sanitized filename-safe string
 */
export function sanitizeForFilename(text, maxLength = CONSTANTS.MAX_FILENAME_LENGTH) {
    if (!text) return '';

    return text
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .substring(0, maxLength);
}

/**
 * Generates a filename for download
 * @param {Object} params - Parameters for filename generation
 * @param {string} params.titleLine1 - First line of title
 * @param {string} params.dateValue - Date value (YYYY-MM-DD)
 * @param {string} params.format - Current aspect ratio/format
 * @returns {string} Generated filename with .png extension
 */
export function generateFilename({ titleLine1, dateValue, format }) {
    let formatSuffix = '';

    if (format === '1:1') {
        formatSuffix = '_square';
    } else if (format === 'obs-hd') {
        formatSuffix = '_obs-hd';
    }

    // For OBS overlay, don't use date/time in filename
    if (format === 'obs-hd') {
        if (titleLine1?.trim()) {
            const cleanTitle = sanitizeForFilename(titleLine1, 40);
            return `${cleanTitle}${formatSuffix}.png`;
        }
        return `vers-libre-event${formatSuffix}.png`;
    }

    // For other formats, include date if available
    let dateText = '';
    if (dateValue?.trim()) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateText = `${year}-${month}-${day}`;
        }
    }

    const title = titleLine1?.trim() || '';

    if (title && dateText) {
        const cleanTitle = sanitizeForFilename(title, 30);
        return `${cleanTitle}_${dateText}${formatSuffix}.png`;
    } else if (title) {
        const cleanTitle = sanitizeForFilename(title, 40);
        return `${cleanTitle}${formatSuffix}.png`;
    } else if (dateText) {
        return `vers-libre-event_${dateText}${formatSuffix}.png`;
    }

    return `vers-libre-event${formatSuffix}.png`;
}

/**
 * Generates time options for select dropdowns
 * @param {number} intervalMinutes - Interval between time options (default: 30)
 * @returns {string[]} Array of time strings in HH:MM format
 */
export function generateTimeOptions(intervalMinutes = 30) {
    const times = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const h = String(hour).padStart(2, '0');
            const m = String(minute).padStart(2, '0');
            times.push(`${h}:${m}`);
        }
    }

    return times;
}
