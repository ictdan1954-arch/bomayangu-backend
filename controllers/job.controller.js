const { Job } = require('../models');
const { Op } = require('sequelize');

// ---------- HELPER: Validate ID ----------
const validateId = (id) => {
    const parsed = parseInt(id);
    if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Invalid ID format');
    }
    return parsed;
};

// ---------- GET ALL ACTIVE JOBS (with optional category filter) ----------
exports.getAll = async (req, res) => {
    try {
        const { category } = req.query;

        // Build where clause
        const where = { is_active: true };
        if (category) {
            where.category = category;
        }

        const jobs = await Job.findAll({
            where,
            order: [['id', 'ASC']]
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get all jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// ---------- GET SINGLE JOB BY ID ----------
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const jobId = validateId(id);

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error('Get job error:', error);
        if (error.message === 'Invalid ID format') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

// ---------- GET JOBS BY CATEGORY (convenience) ----------
exports.getByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        const jobs = await Job.findAll({
            where: {
                is_active: true,
                category: category.toLowerCase().trim()
            },
            order: [['id', 'ASC']]
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get jobs by category error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs by category' });
    }
};
