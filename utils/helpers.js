exports.formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

exports.formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
};

exports.sanitizePhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
};

exports.generateReference = (prefix = 'BOMA') => {
    return ${prefix}--;
};
