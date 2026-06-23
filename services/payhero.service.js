const axios = require('axios');
const payheroConfig = require('../config/payhero');

class PayHeroService {
    constructor() {
        this.baseUrl = payheroConfig.baseUrl;
        this.username = payheroConfig.username;
        this.password = payheroConfig.password;
        this.channelId = payheroConfig.channelId;
        this.initiateEndpoint = payheroConfig.initiateEndpoint || '/payments';
        this.callbackUrl = payheroConfig.callbackUrl;
        this.environment = payheroConfig.environment;

        console.log(`📦 Channel ID: ${this.channelId || 'NOT SET'}`);

        if (!this.channelId) {
            console.warn('⚠️ PAYHERO_CHANNEL_ID is not set – STK Push will fail');
        }
        if (!this.callbackUrl) {
            console.warn('⚠️ PAYHERO_CALLBACK_URL is not set – payment confirmations will not be received');
        }

        this.authToken = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        console.log(`🔧 PayHero service initialized: ${this.baseUrl} (${this.environment})`);
    }

    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('254')) {
            cleaned = '0' + cleaned.substring(3);
        } else if (!cleaned.startsWith('0')) {
            cleaned = '0' + cleaned;
        }
        return cleaned;
    }

    async initiatePayment(phoneNumber, amount, reference, description) {
        const url = `${this.baseUrl}${this.initiateEndpoint}`;
        console.log(`🌐 Full PayHero URL: ${url}`);

        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        const payload = {
            amount: parseFloat(amount),
            phone_number: formattedPhone,
            channel_id: parseInt(this.channelId, 10),
            provider: 'm-pesa',
            external_reference: reference,
            customer_name: description || 'Boma Yangu Job Application',
            callback_url: this.callbackUrl,
        };

        console.log(`📤 Initiating PayHero payment: ${reference} for KES ${amount} to ${formattedPhone}`);
        console.log('📦 Payload:', payload);

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': this.authToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            console.log(`✅ PayHero payment initiated: ${reference}`, {
                status: response.status,
                checkoutRequestId: response.data?.CheckoutRequestID,
                reference: response.data?.reference
            });

            return {
                success: true,
                transaction_id: response.data?.reference,          // This is the MerchantRequestID
                checkout_request_id: response.data?.CheckoutRequestID,
                merchant_request_id: null,
                reference: reference,
                raw: response.data
            };
        } catch (error) {
            console.error(`❌ PayHero payment failed: ${reference}`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            throw new Error(`Payment initiation failed: ${errorMessage}`);
        }
    }

    verifyCallback(callbackData) {
        console.log('📥 Raw callback received:', JSON.stringify(callbackData, null, 2));

        // Extract the inner 'response' object (if present)
        const response = callbackData.response || callbackData;

        // Log the extracted response for debugging
        console.log('📥 Extracted response object:', JSON.stringify(response, null, 2));

        // Extract fields with multiple fallbacks
        const merchantRequestId = response.MerchantRequestID || response.merchant_request_id || response.transaction_id;
        const externalReference = response.ExternalReference || response.external_reference || response.reference;
        const checkoutRequestId = response.CheckoutRequestID || response.checkout_request_id;
        const resultCode = response.ResultCode;
        const resultDesc = response.ResultDesc || response.message;
        const status = response.Status || response.status;
        const amount = response.Amount || response.amount;

        // Determine success: ResultCode 0 means success, or status 'Completed'/'Success'
        const isSuccess = resultCode === 0 || status === 'Completed' || status === 'Success' || status === true;

        const normalized = {
            reference: externalReference,              // Our own reference (APP-...)
            transaction_id: merchantRequestId,         // MerchantRequestID (unique from PayHero)
            checkout_request_id: checkoutRequestId,
            status: isSuccess ? 'completed' : 'failed',
            amount: amount,
            message: resultDesc || 'No description',
            raw: callbackData,
            result_code: resultCode,
            success: isSuccess
        };

        console.log('📊 Normalized callback:', normalized);
        return normalized;
    }

    async checkPaymentStatus(reference) {
        console.log(`ℹ️ Payment status check requested for: ${reference}`);
        return {
            reference: reference,
            status: 'pending',
            message: 'Please wait for the callback notification'
        };
    }
}

module.exports = new PayHeroService();
