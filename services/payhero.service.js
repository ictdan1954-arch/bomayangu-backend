const axios = require('axios');
const payheroConfig = require('../config/payhero');

class PayHeroService {
    constructor() {
        // Read configuration from environment variables
        this.baseUrl = payheroConfig.baseUrl;
        this.username = payheroConfig.username;
        this.password = payheroConfig.password;
        this.accountId = payheroConfig.accountId;
        this.initiateEndpoint = payheroConfig.initiateEndpoint;
        this.callbackUrl = payheroConfig.callbackUrl;
        this.environment = payheroConfig.environment;

        // Generate Basic Auth token (Base64 encoded username:password)
        this.authToken = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        // Log configuration (without sensitive details)
        console.log(`🔧 PayHero service initialized: ${this.baseUrl} (${this.environment})`);
    }

    /**
     * Format phone number to international format (254XXXXXXXXX)
     */
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        return cleaned;
    }

    /**
     * Initiate an STK Push payment via PayHero
     * @param {string} phoneNumber - The customer's phone number (e.g., 0712345678)
     * @param {number} amount - Amount in KES (e.g., 78)
     * @param {string} reference - Unique reference for this transaction (e.g., 'APP-123')
     * @param {string} description - Description of the payment
     * @returns {Promise<Object>} PayHero response
     */
    async initiatePayment(phoneNumber, amount, reference, description) {
        const url = `${this.baseUrl}${this.initiateEndpoint}`;
        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        // Build the request payload – adjust fields based on actual PayHero API docs
        const payload = {
            account_id: this.accountId,
            amount: amount,
            phone_number: formattedPhone,
            reference: reference,
            description: description || 'Boma Yangu Job Application',
            callback_url: this.callbackUrl,
            // Additional fields that PayHero might require
            // channel: 'mpesa', // or 'airtel' if supported
            // currency: 'KES'
        };

        console.log(`📤 Initiating PayHero payment: ${reference} for KES ${amount} to ${formattedPhone}`);

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': this.authToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout
            });

            console.log(`✅ PayHero payment initiated: ${reference}`, {
                status: response.status,
                transactionId: response.data?.transaction_id || response.data?.reference
            });

            // Return a consistent response structure
            return {
                success: true,
                transaction_id: response.data?.transaction_id || response.data?.reference || reference,
                checkout_request_id: response.data?.checkout_request_id || response.data?.request_id,
                merchant_request_id: response.data?.merchant_request_id,
                reference: reference,
                raw: response.data
            };
        } catch (error) {
            // Log detailed error
            console.error(`❌ PayHero payment failed: ${reference}`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            // Throw a user-friendly error
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            throw new Error(`Payment initiation failed: ${errorMessage}`);
        }
    }

    /**
     * Verify a callback from PayHero
     * @param {Object} callbackData - The raw callback payload
     * @returns {Object} Normalized callback data
     */
    verifyCallback(callbackData) {
        // Log the raw callback for debugging
        console.log('📥 PayHero callback received:', {
            reference: callbackData.reference,
            status: callbackData.status,
            transaction_id: callbackData.transaction_id
        });

        // Normalize the callback structure
        const normalized = {
            reference: callbackData.reference,
            transaction_id: callbackData.transaction_id,
            status: callbackData.status, // 'completed', 'failed', etc.
            amount: callbackData.amount,
            message: callbackData.message || callbackData.result_desc,
            raw: callbackData
        };

        // Determine if the payment was successful
        normalized.success = normalized.status === 'completed' || normalized.status === 'success' || callbackData.result_code === 0;

        return normalized;
    }

    /**
     * Check payment status (if PayHero provides a status endpoint)
     * @param {string} reference - The transaction reference
     * @returns {Promise<Object>} Payment status
     */
    async checkPaymentStatus(reference) {
        // Some providers have a status endpoint – implement if PayHero provides one.
        // For now, we rely on callbacks.
        console.log(`ℹ️ Payment status check requested for: ${reference}`);
        // If PayHero has a status endpoint, implement it here.
        // Otherwise, return a message indicating that status is not available.
        return {
            reference: reference,
            status: 'pending',
            message: 'Please wait for the callback notification'
        };
    }
}

module.exports = new PayHeroService();
