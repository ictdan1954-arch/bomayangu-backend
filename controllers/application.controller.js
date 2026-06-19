const { Application, User, Job } = require('../models');

exports.create = async (req, res) => {
    try {
        const { fullName, idNumber, phone, email, county, constituency, jobId } = req.body;

        // Create or find user
        let user = await User.findOne({ where: { id_number: idNumber } });
        if (!user) {
            user = await User.create({
                full_name: fullName,
                id_number: idNumber,
                phone,
                email,
                county,
                constituency
            });
        }

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const application = await Application.create({
            user_id: user.id,
            job_id: job.id,
            job_title: job.title,
            status: 'pending',
            amount: 78
        });

        res.status(201).json({
            success: true,
            applicationId: application.id,
            message: 'Application created. Proceed to payment.'
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: error.message });
    }
};
