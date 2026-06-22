// utils/helpers.js
// Collection of reusable helper functions for the Boma Yangu backend.

/**
 * Format a date to YYYY-MM-DD (ISO date string without time)
 * @param {Date|string} date - The date to format
 * @returns {string|null} Formatted date string or null if invalid
 */
exports.formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
};

/**
 * Format a date to a readable date and time string (Kenya locale)
 * @param {Date|string} date - The date to format
 * @returns {string|null} Formatted date-time string or null if invalid
 */
exports.formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Sanitize and format a phone number to international format (254XXXXXXXXX)
 * @param {string} phone - Raw phone number (e.g., 0712345678)
 * @returns {string} Formatted phone number (e.g., 254712345678)
 */
exports.sanitizePhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
};

/**
 * Generate a unique reference string with a prefix and timestamp
 * @param {string} prefix - Prefix for the reference (default: 'BOMA')
 * @returns {string} Reference string (e.g., BOMA-20260622-123456)
 */
exports.generateReference = (prefix = 'BOMA') => {
    const now = new Date();
    const datePart = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${datePart}-${randomPart}`;
};

/**
 * Generate a simple random ID (numeric)
 * @param {number} length - Length of the random number (default: 6)
 * @returns {number} Random number
 */
exports.generateRandomId = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Truncate a string to a maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @param {string} suffix - Suffix to add if truncated (default: '...')
 * @returns {string} Truncated string
 */
exports.truncate = (str, maxLength = 100, suffix = '...') => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Check if a string is a valid email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
exports.isValidEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Check if a string is a valid phone number (local or international)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
exports.isValidPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return /^[0-9]{9,12}$/.test(cleaned);
};

/**
 * Check if a string is a valid ID number (5 to 12 digits)
 * @param {string} id - ID number to validate
 * @returns {boolean} True if valid
 */
exports.isValidIdNumber = (id) => {
    if (!id) return false;
    return /^[0-9]{5,12}$/.test(id);
};

/**
 * Check if a string is a valid URL (starts with http:// or https://)
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
exports.isValidUrl = (url) => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Mask a string (e.g., for hiding sensitive data) – show only first and last characters
 * @param {string} str - The string to mask
 * @param {number} visibleStart - Number of characters to show at the start (default: 2)
 * @param {number} visibleEnd - Number of characters to show at the end (default: 2)
 * @param {string} maskChar - Character to use for masking (default: '*')
 * @returns {string} Masked string
 */
exports.maskString = (str, visibleStart = 2, visibleEnd = 2, maskChar = '*') => {
    if (!str || str.length <= visibleStart + visibleEnd) return str;
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    const middle = maskChar.repeat(str.length - visibleStart - visibleEnd);
    return start + middle + end;
};

/**
 * Safely parse JSON with a fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Value to return if parsing fails (default: null)
 * @returns {*} Parsed object or fallback
 */
exports.safeJsonParse = (jsonString, fallback = null) => {
    try {
        return JSON.parse(jsonString);
    } catch {
        return fallback;
    }
};

/**
 * Sleep for a given number of milliseconds (async)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get the current timestamp as a string (ISO format)
 * @returns {string} ISO timestamp
 */
exports.getCurrentTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Convert an object to query string parameters
 * @param {Object} params - Key-value pairs
 * @returns {string} Query string (without leading '?')
 */
exports.toQueryString = (params) => {
    return Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
};

/**
 * Check if a value is a plain object (not an array, null, etc.)
 * @param {*} value - Value to check
 * @returns {boolean} True if plain object
 */
exports.isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Pick specific fields from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} New object with only the picked keys
 */
exports.pick = (obj, keys) => {
    const result = {};
    for (const key of keys) {
        if (obj && obj[key] !== undefined) {
            result[key] = obj[key];
        }
    }
    return result;
};

/**
 * Omit specific fields from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} New object without the omitted keys
 */
exports.omit = (obj, keys) => {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
};
