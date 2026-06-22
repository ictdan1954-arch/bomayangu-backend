const { Job, Application, User, Config } = require('../models');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');   // Make sure to install: npm install bcryptjs

// ---------- HELPER: Get admin user ----------
async function getAdminUser() {
    // Look for a user with role 'admin'
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
        // If no admin exists, create one using environment variables (or defaults)
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
// Supports both database (hashed password) and environment variable fallback.
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // First, try to find an admin user in the database
        const admin = await User.findOne({ where: { role: 'admin' } });
        if (admin && admin.password) {
            // Compare with stored hash
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                const token = generateToken({ username, role: 'admin' });
                return res.json({ success: true, token });
            }
        }

        // Fallback: compare against environment variables (for backward compatibility)
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (username === validUsername && password === validPassword) {
            // Optionally, sync the environment credentials to the database
            if (admin) {
                const hashed = await bcrypt.hash(validPassword, 10);
                await admin.update({ password: hashed });
                console.log('✅ Synced environment credentials to database.');
            }
            const token = generateToken({ username, role: 'admin' });
            return res.json({ success: true, token });
        }

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ---------- JOB MANAGEMENT ----------
exports.getJobs = async (req, res) => {
    const jobs = await Job.findAll();
    res.json(jobs);
};

exports.createJob = async (req, res) => {
    const job = await Job.create(req.body);
    res.status(201).json(job);
};

exports.updateJob = async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await job.update(req.body);
    res.json(job);
};

exports.deleteJob = async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await job.destroy();
    res.json({ success: true });
};

// ---------- APPLICATION MANAGEMENT ----------
exports.getApplications = async (req, res) => {
    const applications = await Application.findAll({
        include: [
            { model: User },
            { model: Job }
        ],
        order: [['created_at', 'DESC']]
    });
    res.json(applications);
};

exports.verifyPayment = async (req, res) => {
    const application = await Application.findByPk(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    application.status = 'paid';
    application.paid_at = new Date();
    application.payment_method = req.body.payment_method || 'manual';
    await application.save();
    res.json({ success: true, application });
};

// ---------- CONFIG MANAGEMENT ----------
exports.getConfig = async (req, res) => {
    const configs = await Config.findAll();
    const result = {};
    configs.forEach(c => result[c.key] = c.value);
    res.json(result);
};

exports.updateConfig = async (req, res) => {
    const { key, value } = req.body;
    let config = await Config.findOne({ where: { key } });
    if (config) {
        await config.update({ value });
    } else {
        config = await Config.create({ key, value });
    }
    res.json({ success: true, config });
};

// ---------- PASSWORD CHANGE ----------
// Updates the admin password securely in the database.
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Find the admin user
        const admin = await User.findOne({ where: { role: 'admin' } });
        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        // Verify current password (check against database hash or fallback)
        let isValid = false;
        if (admin.password) {
            isValid = await bcrypt.compare(currentPassword, admin.password);
        }
        // If database doesn't have a password, check against environment variable
        if (!isValid) {
            const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
            if (currentPassword === envPassword) {
                isValid = true;
            }
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash the new password and update the database
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await admin.update({ password: hashedPassword });

        // Optionally, update the environment variable in memory (but not persistent)
        // This is not recommended; use the database as the source of truth.
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
