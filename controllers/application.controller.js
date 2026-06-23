const { Application, User, Job, Config } = require('../models'); // ← added Config

// ---------- HELPER: Validate required fields ----------
const validateApplicationData = (data) => {
    const required = ['fullName', 'idNumber', 'phone', 'county', 'constituency', 'jobId'];
    const missing = required.filter(field => !data[field] || !data[field].toString().trim());
    if (missing.length) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    // Phone number validation (basic)
    const phone = data.phone.replace(/\D/g, '');
    if (!/^[0-9]{9,12}$/.test(phone)) {
        throw new Error('Phone number must be between 9 and 12 digits.');
    }
    return true;
};

// ---------- HELPER: Sanitize phone ----------
const sanitizePhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
};

// ---------- CREATE APPLICATION ----------
exports.create = async (req, res) => {
    try {
        const { fullName, idNumber, phone, email, county, constituency, jobId } = req.body;

        // 1. Validate input
        validateApplicationData({ fullName, idNumber, phone, county, constituency, jobId });

        // 2. Sanitize phone number
        const cleanPhone = sanitizePhone(phone);

        // 3. Find or create user (upsert)
        let user = await User.findOne({ where: { id_number: idNumber } });
        if (!user) {
            user = await User.create({
                full_name: fullName.trim(),
                id_number: idNumber.trim(),
                phone: cleanPhone,
                email: email ? email.trim() : null,
                county: county.trim(),
                constituency: constituency.trim()
            });
        } else {
            // Optionally update user details if they've changed
            await user.update({
                full_name: fullName.trim(),
                phone: cleanPhone,
                email: email ? email.trim() : user.email,
                county: county.trim(),
                constituency: constituency.trim()
            });
        }

        // 4. Check if job exists
        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // 5. Get the current application fee from Config
        const config = await Config.findOne({ where: { key: 'application_fee' } });
        const fee = config ? parseFloat(config.value) : 78; // fallback to 78 if not set

        // 6. Create application with the live fee
        const application = await Application.create({
            user_id: user.id,
            job_id: job.id,
            job_title: job.title,
            status: 'pending',
            amount: fee // ← now uses the live fee from admin
        });

        // 7. Return success response
        res.status(201).json({
            success: true,
            applicationId: application.id,
            userId: user.id,
            message: 'Application created. Proceed to payment.',
            application: {
                id: application.id,
                jobTitle: application.job_title,
                status: application.status,
                amount: application.amount
            }
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
