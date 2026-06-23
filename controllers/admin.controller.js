const { Job, Application, User, Config } = require('../models');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ---------- HELPER: Ensure admin user exists ----------
async function getAdminUser() {
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        admin = await User.create({
            full_name: 'Administrator',
            id_number: '00000000',
            phone: '0700000000',
            email: 'admin@bomayangu.go.ke',
            role: 'admin',
            password: hashedPassword
        });
        console.log('✅ Admin user created with default credentials.');
    }
    return admin;
}

// ---------- ADMIN LOGIN ----------
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await getAdminUser();
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            const envUsername = process.env.ADMIN_USERNAME || 'admin';
            const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
            if (username === envUsername && password === envPassword) {
                const hashed = await bcrypt.hash(envPassword, 10);
                await admin.update({ password: hashed });
                console.log('✅ Synced environment credentials to database.');
                const token = generateToken({ username, role: 'admin' });
                return res.json({ success: true, token });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken({ username: admin.username || username, role: 'admin' });
        res.json({ success: true, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ---------- JOB MANAGEMENT ----------
exports.getJobs = async (req, res) => {
    try {
        // ✅ FIXED: use snake_case column name for ordering
        const jobs = await Job.findAll({
            order: [['created_at', 'DESC']] // or use ['id', 'DESC']
        });
        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

exports.createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.status(201).json(job);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        await job.update(req.body);
        res.json(job);
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        await job.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};

// ---------- APPLICATION MANAGEMENT ----------
exports.getApplications = async (req, res) => {
    try {
        const applications = await Application.findAll({
            include: [
                { model: User },
                { model: Job }
            ],
            order: [['created_at', 'DESC']] // also fix here
        });
        res.json(applications);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });
        application.status = 'paid';
        application.paid_at = new Date();
        application.payment_method = req.body.payment_method || 'manual';
        await application.save();
        res.json({ success: true, application });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

// ---------- CONFIG MANAGEMENT ----------
const ALLOWED_CONFIG_KEYS = ['stk_enabled', 'application_fee', 'application_end_date'];

exports.getConfig = async (req, res) => {
    try {
        const configs = await Config.findAll({
            where: { key: ALLOWED_CONFIG_KEYS }
        });
        const result = {};
        configs.forEach(c => result[c.key] = c.value);
        if (!result.stk_enabled) result.stk_enabled = 'true';
        if (!result.application_fee) result.application_fee = '78';
        if (!result.application_end_date) result.application_end_date = '2026-08-13';
        res.json(result);
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!ALLOWED_CONFIG_KEYS.includes(key)) {
            return res.status(400).json({ error: 'Invalid config key' });
        }
        let parsedValue = value;
        if (key === 'stk_enabled') {
            parsedValue = (value === 'true' || value === true) ? 'true' : 'false';
        } else if (key === 'application_fee') {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0) {
                return res.status(400).json({ error: 'Fee must be a positive number' });
            }
            parsedValue = String(num);
        } else if (key === 'application_end_date') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' });
            }
            parsedValue = value;
        }
        let config = await Config.findOne({ where: { key } });
        if (config) {
            await config.update({ value: parsedValue });
        } else {
            config = await Config.create({ key, value: parsedValue });
        }
        res.json({ success: true, config });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
};

// ---------- ADMIN PASSWORD CHANGE ----------
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        const admin = await getAdminUser();
        let isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) {
            const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
            if (currentPassword === envPassword) {
                isValid = true;
            }
        }
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await admin.update({ password: hashedPassword });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
