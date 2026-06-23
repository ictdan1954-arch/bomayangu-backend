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
        // console.log('📦 Payload:', payload);

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
                transaction_id: response.data?.reference,
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
        // The callback structure has a 'response' object containing the payment result
        const response = callbackData.response || callbackData;
        console.log('📥 PayHero callback received:', response);

        // Extract key fields from the response
        const reference = response.ExternalReference || response.reference;
        const transactionId = response.MerchantRequestID || response.transaction_id || response.CheckoutRequestID;
        const status = response.Status || response.status;
        const resultCode = response.ResultCode;
        const resultDesc = response.ResultDesc || response.message;

        // Determine if payment was successful (ResultCode 0 means success)
        const success = resultCode === 0 || status === 'Completed' || status === 'Success';

        const normalized = {
            reference: reference,
            transaction_id: transactionId,
            status: success ? 'completed' : 'failed',
            amount: response.Amount || response.amount,
            message: resultDesc,
            raw: callbackData,
            result_code: resultCode
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
