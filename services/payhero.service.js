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

        // ✅ Log the channel ID (masked for security)
        console.log(`📦 Channel ID: ${this.channelId || 'NOT SET'}`);

        // Validate critical config
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
            amount: amount,
            phone_number: formattedPhone,
            channel_id: this.channelId,
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
        console.log('📥 PayHero callback received:', {
            reference: callbackData.reference,
            status: callbackData.status,
            transaction_id: callbackData.transaction_id
        });

        const normalized = {
            reference: callbackData.reference,
            transaction_id: callbackData.transaction_id,
            status: callbackData.status,
            amount: callbackData.amount,
            message: callbackData.message || callbackData.result_desc,
            raw: callbackData
        };

        normalized.success = normalized.status === 'completed' || normalized.status === 'success' || callbackData.result_code === 0;
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
