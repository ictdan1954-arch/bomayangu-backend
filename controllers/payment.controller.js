const { Application, Payment, User } = require('../models');
const PayHeroService = require('../services/payhero.service');
const NotificationService = require('../services/notification.service');

// ---------- INITIATE STK PUSH (PAYHERO) ----------
// Sends a payment request to the user's phone via PayHero.
exports.initiateSTKPush = async (req, res) => {
    try {
        const { applicationId, phoneNumber } = req.body;

        // 1. Validate application exists
        const application = await Application.findByPk(applicationId, {
            include: [{ model: User }]
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // 2. Check if already paid
        if (application.status === 'paid') {
            return res.status(400).json({ error: 'This application has already been paid' });
        }

        // 3. Set payment amount
        const fee = 78;
        const reference = `APP-${applicationId}`;

        // 4. Initiate payment via PayHero
        const result = await PayHeroService.initiatePayment(
            phoneNumber,
            fee,
            reference,
            'Boma Yangu Job Application'
        );

        // 5. Save payment record
        const payment = await Payment.create({
            application_id: applicationId,
            amount: fee,
            payment_method: 'stk_push',
            status: 'pending',
            transaction_id: result.transaction_id || result.reference || reference,
            merchant_request_id: result.merchant_request_id || result.transaction_id,
            checkout_request_id: result.checkout_request_id || result.reference,
            callback_data: result
        });

        // 6. Return success response
        res.json({
            success: true,
            message: 'STK Push sent successfully. Please check your phone to complete payment.',
            transactionId: payment.transaction_id,
            checkoutRequestId: payment.checkout_request_id,
            paymentId: payment.id
        });

    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({
            error: error.message || 'Failed to initiate payment. Please try again.'
        });
    }
};

// ---------- CHECK PAYMENT STATUS (OPTIONAL) ----------
// Verifies if a payment has been completed.
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findByPk(applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const payment = await Payment.findOne({
            where: { application_id: applicationId },
            order: [['created_at', 'DESC']]
        });

        res.json({
            applicationId: application.id,
            status: application.status,
            payment: payment ? {
                status: payment.status,
                method: payment.payment_method,
                amount: payment.amount,
                transactionId: payment.transaction_id,
                paidAt: application.paid_at
            } : null
        });

    } catch (error) {
        console.error('Check payment status error:', error);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
};
