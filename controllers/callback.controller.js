const { Application, Payment, User } = require('../models');
const NotificationService = require('../services/notification.service');

// ---------- PAYHERO CALLBACK ----------
// Handles payment confirmations from PayHero after STK Push
exports.payheroCallback = async (req, res) => {
    try {
        const callbackData = req.body;

        // Extract key fields – adjust based on PayHero's actual callback structure
        const {
            reference,          // e.g., "APP-12345" (your account reference)
            transaction_id,     // e.g., "TX123456"
            status,             // e.g., "completed", "failed"
            amount,
            message
        } = callbackData;

        // Log the raw callback for debugging
        console.log('PayHero callback received:', callbackData);

        // Find the payment record by reference (you stored it as transaction_id)
        let payment = await Payment.findOne({
            where: { transaction_id: reference }
        });

        // If not found by reference, try to find by transaction_id
        if (!payment && transaction_id) {
            payment = await Payment.findOne({
                where: { transaction_id: transaction_id }
            });
        }

        if (!payment) {
            console.log(`Payment not found for reference: ${reference} or transaction: ${transaction_id}`);
            // Always return 200 OK to prevent PayHero from retrying
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        // Update payment record
        payment.result_desc = message || status;
        payment.callback_data = callbackData;
        payment.status = status === 'completed' ? 'completed' : 'failed';
        if (transaction_id) {
            payment.transaction_id = transaction_id;
        }
        await payment.save();

        // If payment was successful, update the associated application
        if (status === 'completed') {
            const application = await Application.findByPk(payment.application_id, {
                include: [{ model: User }]
            });

            if (application) {
                application.status = 'paid';
                application.paid_at = new Date();
                application.payment_method = 'stk_push';
                application.transaction_id = transaction_id || reference;
                await application.save();

                // Send confirmation notification to the user
                await NotificationService.sendPaymentConfirmation(application);
            }
        }

        // Respond to PayHero (always 200 OK)
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('PayHero callback error:', error);
        // Still return 200 to avoid retries
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
};
