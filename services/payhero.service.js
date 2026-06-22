const axios = require('axios');
const payheroConfig = require('../config/payhero');

class PayHeroService {
    constructor() {
        this.baseUrl = payheroConfig.baseUrl;
        this.username = payheroConfig.username;
        this.password = payheroConfig.password;
        this.accountId = payheroConfig.accountId;
        this.initiateEndpoint = payheroConfig.initiateEndpoint;
        this.callbackUrl = payheroConfig.callbackUrl;
        this.environment = payheroConfig.environment;

        this.authToken = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        console.log(`🔧 PayHero service initialized: ${this.baseUrl} (${this.environment})`);
    }

    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        return cleaned;
    }

    async initiatePayment(phoneNumber, amount, reference, description) {
        // Build the full URL
        const url = `${this.baseUrl}${this.initiateEndpoint}`;
        // 👇 NEW: Log the exact URL being called
        console.log(`🌐 Full PayHero URL: ${url}`);

        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        const payload = {
            account_id: this.accountId,
            amount: amount,
            phone_number: formattedPhone,
            reference: reference,
            description: description || 'Boma Yangu Job Application',
            callback_url: this.callbackUrl,
        };

        console.log(`📤 Initiating PayHero payment: ${reference} for KES ${amount} to ${formattedPhone}`);

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
                transactionId: response.data?.transaction_id || response.data?.reference
            });

            return {
                success: true,
                transaction_id: response.data?.transaction_id || response.data?.reference || reference,
                checkout_request_id: response.data?.checkout_request_id || response.data?.request_id,
                merchant_request_id: response.data?.merchant_request_id,
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
