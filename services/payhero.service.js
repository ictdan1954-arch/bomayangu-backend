const axios = require('axios');
const payheroConfig = require('../config/payhero');

class PayHeroService {
    constructor() {
        // Read configuration from environment variables
        this.baseUrl = payheroConfig.baseUrl;          // https://backend.payhero.co.ke/api/v2
        this.username = payheroConfig.username;
        this.password = payheroConfig.password;
        this.channelId = payheroConfig.channelId;      // IMPORTANT: get this from PayHero dashboard
        this.initiateEndpoint = payheroConfig.initiateEndpoint; // '/payments'
        this.callbackUrl = payheroConfig.callbackUrl;
        this.environment = payheroConfig.environment;

        this.authToken = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        console.log(`🔧 PayHero service initialized: ${this.baseUrl} (${this.environment})`);
    }

    formatPhoneNumber(phoneNumber) {
        // Accepts 0712345678 or 254712345678 → returns 0712345678 (as required by PayHero)
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('254')) {
            cleaned = '0' + cleaned.substring(3);
        }
        // If it doesn't start with 0, assume it's already in local format
        if (!cleaned.startsWith('0')) {
            cleaned = '0' + cleaned;
        }
        return cleaned;
    }

    async initiatePayment(phoneNumber, amount, reference, description) {
        const url = `${this.baseUrl}${this.initiateEndpoint}`;
        console.log(`🌐 Full PayHero URL: ${url}`);

        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        // Build payload according to official docs
        const payload = {
            amount: amount,
            phone_number: formattedPhone,
            channel_id: this.channelId,                 // e.g., 133 – from your dashboard
            provider: 'm-pesa',                         // required, fixed value
            external_reference: reference,              // your unique ref (e.g., APP-5)
            customer_name: description || 'Boma Yangu Job Application',
            callback_url: this.callbackUrl,
            // credential_id: optional – only if using your own Daraja keys
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
                checkoutRequestId: response.data?.CheckoutRequestID,
                reference: response.data?.reference
            });

            // Normalize response to keep your existing code consistent
            return {
                success: true,
                transaction_id: response.data?.reference,          // PayHero returns 'reference'
                checkout_request_id: response.data?.CheckoutRequestID,
                merchant_request_id: null,                         // not provided
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

    // verifyCallback and checkPaymentStatus remain the same (they work with the callback)
    // ...
}

module.exports = new PayHeroService();
