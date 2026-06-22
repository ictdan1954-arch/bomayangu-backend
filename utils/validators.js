// utils/validators.js
// Input validation utilities for the Boma Yangu backend.

/**
 * Validate an email address using a standard regex.
 * @param {string} email - The email to validate.
 * @returns {boolean} True if valid.
 */
exports.validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Validate a phone number (digits only, 9-12 characters).
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} True if valid.
 */
exports.validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return /^[0-9]{9,12}$/.test(cleaned);
};

/**
 * Validate an ID number (digits only, 5-12 characters).
 * @param {string} id - The ID number to validate.
 * @returns {boolean} True if valid.
 */
exports.validateIdNumber = (id) => {
    if (!id) return false;
    return /^[0-9]{5,12}$/.test(id);
};

/**
 * Validate that a field is not empty (string, array, or object).
 * @param {*} value - The value to check.
 * @param {string} fieldName - The name of the field (for error messages).
 * @returns {Object} { valid: boolean, message: string }.
 */
exports.validateRequired = (value, fieldName) => {
    const isValid = value !== undefined && value !== null && value !== '';
    return {
        valid: isValid,
        message: isValid ? '' : `${fieldName} is required`
    };
};

/**
 * Validate the length of a string.
 * @param {string} value - The string to check.
 * @param {number} min - Minimum length (optional).
 * @param {number} max - Maximum length (optional).
 * @param {string} fieldName - The name of the field (for error messages).
 * @returns {Object} { valid: boolean, message: string }.
 */
exports.validateLength = (value, fieldName, min = null, max = null) => {
    if (value === undefined || value === null) {
        return { valid: false, message: `${fieldName} is required` };
    }
    const length = String(value).length;
    if (min !== null && length < min) {
        return { valid: false, message: `${fieldName} must be at least ${min} characters` };
    }
    if (max !== null && length > max) {
        return { valid: false, message: `${fieldName} must be at most ${max} characters` };
    }
    return { valid: true, message: '' };
};

/**
 * Validate that a value is in a list of allowed values.
 * @param {*} value - The value to check.
 * @param {Array} allowedValues - Array of allowed values.
 * @param {string} fieldName - The name of the field (for error messages).
 * @returns {Object} { valid: boolean, message: string }.
 */
exports.validateEnum = (value, allowedValues, fieldName) => {
    const isValid = allowedValues.includes(value);
    return {
        valid: isValid,
        message: isValid ? '' : `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
};

/**
 * Validate a complete job application.
 * @param {Object} data - The application data.
 * @param {string} data.fullName - Full name of applicant.
 * @param {string} data.idNumber - ID number.
 * @param {string} data.phone - Phone number.
 * @param {string} data.county - County of residence.
 * @param {string} data.constituency - Constituency of residence.
 * @param {string} [data.email] - Optional email.
 * @returns {Array<string>} Array of error messages (empty if valid).
 */
exports.validateApplication = (data) => {
    const errors = [];

    // Required fields
    if (!data.fullName || data.fullName.trim() === '') {
        errors.push('Full name is required');
    }
    if (!data.idNumber || !exports.validateIdNumber(data.idNumber)) {
        errors.push('Valid ID number is required (5 to 12 digits)');
    }
    if (!data.phone || !exports.validatePhone(data.phone)) {
        errors.push('Valid phone number is required (9 to 12 digits)');
    }
    if (!data.county || data.county.trim() === '') {
        errors.push('County is required');
    }
    if (!data.constituency || data.constituency.trim() === '') {
        errors.push('Constituency is required');
    }

    // Optional email validation (if provided)
    if (data.email && !exports.validateEmail(data.email)) {
        errors.push('Email format is invalid');
    }

    return errors;
};

/**
 * Validate a job object (for admin creation/update).
 * @param {Object} data - The job data.
 * @param {string} data.title - Job title.
 * @param {string} data.category - Job category.
 * @param {number} data.salary - Salary amount.
 * @param {*} data.slots - Slots (number or string).
 * @returns {Array<string>} Array of error messages (empty if valid).
 */
exports.validateJob = (data) => {
    const errors = [];

    if (!data.title || data.title.trim() === '') {
        errors.push('Job title is required');
    }
    if (!data.category || !['driver', 'cleaner', 'caretaker', 'security'].includes(data.category)) {
        errors.push('Category must be one of: driver, cleaner, caretaker, security');
    }
    if (data.salary !== undefined && (isNaN(data.salary) || data.salary < 0)) {
        errors.push('Salary must be a positive number');
    }
    // slots can be a number, '0', or a string like 'Nairobi' – minimal validation
    if (data.slots === undefined || data.slots === null) {
        errors.push('Slots are required');
    }

    return errors;
};

/**
 * Validate a payment initiation request.
 * @param {Object} data - Payment data.
 * @param {string} data.applicationId - Application ID.
 * @param {string} data.phoneNumber - Phone number.
 * @returns {Array<string>} Array of error messages (empty if valid).
 */
exports.validatePayment = (data) => {
    const errors = [];

    if (!data.applicationId || isNaN(parseInt(data.applicationId))) {
        errors.push('Valid application ID is required');
    }
    if (!data.phoneNumber || !exports.validatePhone(data.phoneNumber)) {
        errors.push('Valid phone number is required (9 to 12 digits)');
    }

    return errors;
};
