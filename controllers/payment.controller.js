const { Application, Payment, User } = require('../models');
const MpesaService = require('../services/mpesa.service');
const NotificationService = require('../services/notification.service');

exports.initiateSTKPush = async (req, res) => {
    try {
        const { applicationId, phoneNumber } = req.body;

        const application = await Application.findByPk(applicationId, {
            include: [{ model: User }]
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (application.status === 'paid') {
            return res.status(400).json({ error: 'Already paid' });
        }

        const fee = 78;
        const result = await MpesaService.stkPush(
            phoneNumber,
            fee,
            'APP-' + applicationId,
            'Boma Yangu Job Application'
        );

        await Payment.create({
            application_id: applicationId,
            amount: fee,
            payment_method: 'stk_push',
            status: 'pending',
            merchant_request_id: result.MerchantRequestID,
            checkout_request_id: result.CheckoutRequestID,
            callback_data: result
        });

        res.json({
            success: true,
            message: 'STK Push sent successfully',
            checkoutRequestId: result.CheckoutRequestID,
            merchantRequestId: result.MerchantRequestID
        });
    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.initiatePaybill = async (req, res) => {
    try {
        const { applicationId, phoneNumber } = req.body;

        const application = await Application.findByPk(applicationId, {
            include: [{ model: User }]
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (application.status === 'paid') {
            return res.status(400).json({ error: 'Already paid' });
        }

        const fee = 78;
        const config = await require('../models').Config.findOne({ where: { key: 'paybill_number' } });
        const paybillNumber = config ? config.value : '787878';

        await Payment.create({
            application_id: applicationId,
            amount: fee,
            payment_method: 'paybill',
            status: 'pending',
            transaction_id: 'PB-' + applicationId + '-' + Date.now()
        });

        res.json({
            success: true,
            message: 'Paybill details provided',
            paybillNumber: paybillNumber,
            accountNumber: application.User ? application.User.phone : phoneNumber,
            amount: fee
        });
    } catch (error) {
        console.error('Paybill error:', error);
        res.status(500).json({ error: error.message });
    }
};
