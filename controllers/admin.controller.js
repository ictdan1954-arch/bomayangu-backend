const { Job, Application, User, Config } = require('../models');
const { generateToken } = require('../middleware/auth');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = generateToken({ username, role: 'admin' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

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
