const { Application, Payment, User } = require('../models');
const NotificationService = require('../services/notification.service');

exports.mpesaCallback = async (req, res) => {
    try {
        const { Body } = req.body;
        const { stkCallback } = Body;

        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const checkoutRequestId = stkCallback.CheckoutRequestID;

        const payment = await Payment.findOne({
            where: { checkout_request_id: checkoutRequestId }
        });

        if (!payment) {
            console.log(`Payment not found for checkoutRequestId: ${checkoutRequestId}`);
            return res.json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        payment.result_code = resultCode;
        payment.result_desc = resultDesc;
        payment.callback_data = req.body;
        payment.status = resultCode === 0 ? 'completed' : 'failed';
        await payment.save();

        if (resultCode === 0) {
            const application = await Application.findByPk(payment.application_id, {
                include: [{ model: User }]
            });
            if (application) {
                application.status = 'paid';
                application.paid_at = new Date();
                application.payment_method = 'stk_push';
                application.transaction_id = checkoutRequestId;
                await application.save();

                await NotificationService.sendPaymentConfirmation(application);
            }
        }

        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('Callback error:', error);
        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }
};

exports.paybillCallback = async (req, res) => {
    try {
        const { transactionId, phoneNumber, amount } = req.body;
        const payment = await Payment.findOne({
            where: { transaction_id: transactionId, payment_method: 'paybill' }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        payment.status = 'completed';
        await payment.save();

        const application = await Application.findByPk(payment.application_id, {
            include: [{ model: User }]
        });

        if (application) {
            application.status = 'paid';
            application.paid_at = new Date();
            application.payment_method = 'paybill';
            application.transaction_id = transactionId;
            await application.save();

            await NotificationService.sendPaymentConfirmation(application);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Paybill callback error:', error);
        res.status(500).json({ error: error.message });
    }
};
