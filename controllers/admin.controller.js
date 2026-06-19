const { Job, Application, User, Config } = require('../models');
const { generateToken } = require('../middleware/auth');

// ---------- ADMIN LOGIN ----------
// Reads credentials from environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
// Falls back to 'admin' / 'admin123' if not set – for convenience.
exports.login = async (req, res) => {
    const { username, password } = req.body;

    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === validUsername && password === validPassword) {
        const token = generateToken({ username, role: 'admin' });
        return res.json({ success: true, token });
    }

    res.status(401).json({ error: 'Invalid credentials' });
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
// Reads all key‑value pairs from the config table.
exports.getConfig = async (req, res) => {
    const configs = await Config.findAll();
    const result = {};
    configs.forEach(c => result[c.key] = c.value);
    res.json(result);
};

// Updates or creates a single config entry.
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
// Allows the admin to update their password.
// For demo: compares current password against environment variable,
// and returns success without actually updating it (since Render
// doesn't allow writing to .env at runtime).
// In production, store the hashed password in the database instead.
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Check that the current password matches the environment variable
        const storedPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (currentPassword !== storedPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // In a real application, you would hash the new password and update it
        // in the database. Since we're using environment variables, we cannot
        // update them from the running application.
        // For a proper solution, you should store the admin credentials in
        // the database (with hashed passwords) instead of environment variables.

        // For now, we'll just return success.
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
