const { Application, Payment } = require('../models');
const payheroService = require('../services/payhero.service');

// ---------- INITIATE STK PUSH ----------
// Called from the frontend after creating an application
exports.initiateSTKPush = async (req, res) => {
    try {
        const { applicationId, phoneNumber } = req.body;

        // 1. Find the application
        const application = await Application.findByPk(applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // 2. Get the fee from config (or use default)
        const fee = application.amount || 78;

        // 3. Generate a unique reference (we'll use this to match the callback)
        const reference = `APP-${applicationId}-${Date.now()}`;

        // 4. Initiate payment via PayHero
        const result = await payheroService.initiatePayment(
            phoneNumber,
            fee,
            reference,
            `Boma Yangu - ${application.job_title || 'Application'}`
        );

        // 5. Save the payment record with the PayHero reference
        await Payment.create({
            application_id: applicationId,
            amount: fee,
            phone: phoneNumber,
            transaction_id: result.transaction_id,   // ← this is the PayHero reference
            checkout_request_id: result.checkout_request_id,
            status: 'pending',
            provider: 'payhero',
            payment_response: result.raw
        });

        // 6. Update application status to 'pending_payment' (optional)
        // application.status = 'pending_payment';
        // await application.save();

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

// ---------- HANDLE PAYHERO CALLBACK ----------
// This endpoint is called by PayHero when the payment is completed or fails
exports.handleCallback = async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('📥 Callback received:', callbackData);

        // 1. Normalize using the service (checks for success)
        const normalized = payheroService.verifyCallback(callbackData);

        // 2. Find the payment record using the transaction_id (which is PayHero's reference)
        const payment = await Payment.findOne({
            where: { transaction_id: normalized.reference }
        });

        if (!payment) {
            console.warn('⚠️ Payment not found for reference:', normalized.reference);
            return res.status(404).send('Payment not found');
        }

        // 3. Update the payment record
        payment.status = normalized.success ? 'completed' : 'failed';
        payment.paid_at = normalized.success ? new Date() : null;
        payment.payment_response = callbackData;
        await payment.save();

        // 4. Update the associated application
        const application = await Application.findByPk(payment.application_id);
        if (application) {
            if (normalized.success) {
                application.status = 'paid';
                application.paid_at = new Date();
                application.payment_method = 'stk_push';
                application.transaction_id = normalized.reference; // store the ref
            } else {
                application.status = 'payment_failed';
            }
            await application.save();
            console.log(`✅ Application ${application.id} status updated to ${application.status}`);
        } else {
            console.warn('⚠️ Application not found for payment:', payment.id);
        }

        // 5. Acknowledge the callback (PayHero expects 200 OK)
        res.status(200).send('OK');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Error');
    }
};

// ---------- (Optional) GET PAYMENT STATUS ----------
// If you need to check status manually (e.g., for debugging)
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
