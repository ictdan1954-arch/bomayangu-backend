const { Application, Payment } = require('../models');
const payheroService = require('../services/payhero.service');

exports.initiateSTKPush = async (req, res) => {
    try {
        const { applicationId, phoneNumber } = req.body;

        const application = await Application.findByPk(applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const fee = application.amount || 78;
        const reference = `APP-${applicationId}-${Date.now()}`;

        const result = await payheroService.initiatePayment(
            phoneNumber,
            fee,
            reference,
            `Boma Yangu - ${application.job_title || 'Application'}`
        );

        // Store the MerchantRequestID as transaction_id
        await Payment.create({
            application_id: applicationId,
            amount: fee,
            phone: phoneNumber,
            transaction_id: result.transaction_id,        // ← MerchantRequestID
            checkout_request_id: result.checkout_request_id,
            status: 'pending',
            provider: 'payhero',
            payment_response: result.raw
        });

        res.status(200).json({
            success: true,
            message: 'STK Push sent successfully',
            data: result
        });
    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({ error: error.message || 'Failed to initiate payment' });
    }
};

exports.handleCallback = async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('📥 Raw callback received (controller):', JSON.stringify(callbackData, null, 2));

        const normalized = payheroService.verifyCallback(callbackData);
        console.log('📊 Normalized callback (controller):', JSON.stringify(normalized, null, 2));

        // Try to find payment by MerchantRequestID first, then fallback to ExternalReference
        let payment = null;
        if (normalized.transaction_id) {
            payment = await Payment.findOne({
                where: { transaction_id: normalized.transaction_id }
            });
        }

        // If not found and we have a reference, try by external_reference (our own reference)
        if (!payment && normalized.reference) {
            payment = await Payment.findOne({
                where: { transaction_id: normalized.reference } // in case we stored our ref as transaction_id
            });
        }

        if (!payment) {
            // Last resort: try to find by application_id if we can extract it from the reference
            console.warn('⚠️ Payment not found for transaction_id:', normalized.transaction_id, 'or reference:', normalized.reference);
            return res.status(404).send('Payment not found');
        }

        // Update payment record
        payment.status = normalized.success ? 'completed' : 'failed';
        payment.paid_at = normalized.success ? new Date() : null;
        payment.payment_response = callbackData;
        await payment.save();
        console.log(`✅ Payment ${payment.id} status updated to ${payment.status}`);

        // Update the associated application
        const application = await Application.findByPk(payment.application_id);
        if (application) {
            if (normalized.success) {
                application.status = 'paid';
                application.paid_at = new Date();
                application.payment_method = 'stk_push';
                application.transaction_id = normalized.transaction_id || normalized.reference;
            } else {
                application.status = 'payment_failed';
            }
            await application.save();
            console.log(`✅ Application ${application.id} status updated to ${application.status}`);
        } else {
            console.warn('⚠️ Application not found for payment:', payment.id);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Error');
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const { reference } = req.params;
        const payment = await Payment.findOne({
            where: { transaction_id: reference },
            include: [{ model: Application }]
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json({
            transaction_id: payment.transaction_id,
            status: payment.status,
            application_status: payment.Application ? payment.Application.status : null,
            paid_at: payment.paid_at
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Failed to fetch payment status' });
    }
};
