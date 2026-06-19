exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

exports.validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^[0-9]{9,12}$/.test(cleaned);
};

exports.validateIdNumber = (id) => {
    return /^[0-9]{5,12}$/.test(id);
};

exports.validateApplication = (data) => {
    const errors = [];
    if (!data.fullName) errors.push('Full name is required');
    if (!data.idNumber || !exports.validateIdNumber(data.idNumber)) {
        errors.push('Valid ID number is required');
    }
    if (!data.phone || !exports.validatePhone(data.phone)) {
        errors.push('Valid phone number is required');
    }
    if (!data.county) errors.push('County is required');
    if (!data.constituency) errors.push('Constituency is required');
    return errors;
};
