const axios = require('axios');
const payheroConfig = require('../config/payhero');

class PayHeroService {
    constructor() {
        // Read configuration from environment variables
        this.baseUrl = payheroConfig.baseUrl;          // https://backend.payhero.co.ke/api/v2
        this.username = payheroConfig.username;
        this.password = payheroConfig.password;
        this.channelId = payheroConfig.channelId;      // REQUIRED: from PayHero dashboard
        this.initiateEndpoint = payheroConfig.initiateEndpoint || '/payments';
        this.callbackUrl = payheroConfig.callbackUrl;  // REQUIRED: your callback endpoint
        this.environment = payheroConfig.environment;

        // Validate critical config
        if (!this.channelId) {
            console.warn('⚠️ PAYHERO_CHANNEL_ID is not set – STK Push will fail');
        }
        if (!this.callbackUrl) {
            console.warn('⚠️ PAYHERO_CALLBACK_URL is not set – payment confirmations will not be received');
        }

        // Generate Basic Auth token
        this.authToken = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        console.log(`🔧 PayHero service initialized: ${this.baseUrl} (${this.environment})`);
    }

    /**
     * Format phone number to local format (0XXXXXXXXX) as required by PayHero
     * Accepts: 0712345678, 254712345678, 712345678 → returns 0712345678
     */
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, ''); // remove non-digits

        if (cleaned.startsWith('254')) {
            cleaned = '0' + cleaned.substring(3);
        } else if (!cleaned.startsWith('0')) {
            cleaned = '0' + cleaned;
        }
        return cleaned;
    }

    /**
     * Initiate an STK Push payment via PayHero
     * @param {string} phoneNumber - Customer's phone (e.g., 0712345678)
     * @param {number} amount - Amount in KES (e.g., 78)
     * @param {string} reference - Your unique reference (e.g., 'APP-123')
     * @param {string} description - Customer name or description
     * @returns {Promise<Object>} Normalized response
     */
    async initiatePayment(phoneNumber, amount, reference, description) {
        const url = `${this.baseUrl}${this.initiateEndpoint}`;
        console.log(`🌐 Full PayHero URL: ${url}`);

        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        // Build payload exactly as per PayHero docs
        const payload = {
            amount: amount,
            phone_number: formattedPhone,
            channel_id: this.channelId,
            provider: 'm-pesa',                         // fixed value
            external_reference: reference,
            customer_name: description || 'Boma Yangu Job Application',
            callback_url: this.callbackUrl,
            // credential_id: optional – only if using your own Daraja keys
        };

        console.log(`📤 Initiating PayHero payment: ${reference} for KES ${amount} to ${formattedPhone}`);
        // console.log('📦 Payload:', payload); // uncomment for deep debugging

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

    /**
     * Verify a callback from PayHero
     * @param {Object} callbackData - Raw callback payload
     * @returns {Object} Normalized callback data
     */
    verifyCallback(callbackData) {
        console.log('📥 PayHero callback received:', {
            reference: callbackData.reference,
            status: callbackData.status,
            transaction_id: callbackData.transaction_id
        });

        const normalized = {
            reference: callbackData.reference,
            transaction_id: callbackData.transaction_id,
            status: callbackData.status, // 'completed', 'failed', etc.
            amount: callbackData.amount,
            message: callbackData.message || callbackData.result_desc,
            raw: callbackData
        };

        // Determine success based on common PayHero response fields
        normalized.success = normalized.status === 'completed' || normalized.status === 'success' || callbackData.result_code === 0;

        return normalized;
    }

    /**
     * Check payment status (if PayHero provides a status endpoint)
     * Currently relies on callbacks – override if you have a status API.
     */
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
