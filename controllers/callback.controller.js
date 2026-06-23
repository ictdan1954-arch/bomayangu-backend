const { Application, Payment } = require('../models');
const payheroService = require('../services/payhero.service');
const NotificationService = require('../services/notification.service'); // ← added

exports.initiateSTKPush = async (req, res) => {
    // ... unchanged ...
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

        if (!payment && normalized.reference) {
            payment = await Payment.findOne({
                where: { transaction_id: normalized.reference }
            });
        }

        if (!payment) {
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
        const application = await Application.findByPk(payment.application_id, {
            include: [{ model: User }] // include User for notifications
        });

        if (application) {
            if (normalized.success) {
                application.status = 'paid';
                application.paid_at = new Date();
                application.payment_method = 'stk_push';
                application.transaction_id = normalized.transaction_id || normalized.reference;
                await application.save();

                // ✅ Send payment confirmation notification
                await NotificationService.sendPaymentConfirmation(application);
            } else {
                application.status = 'payment_failed';
                await application.save();
            }
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
    // ... unchanged ...
};
