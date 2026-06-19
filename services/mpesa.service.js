const axios = require('axios');
const mpesaConfig = require('../config/mpesa');

class MpesaService {
    constructor() {
        this.consumerKey = mpesaConfig.consumerKey;
        this.consumerSecret = mpesaConfig.consumerSecret;
        this.shortcode = mpesaConfig.shortcode;
        this.passkey = mpesaConfig.passkey;
        this.callbackUrl = mpesaConfig.callbackUrl;
        this.baseUrl = mpesaConfig.baseUrl;
        this.environment = mpesaConfig.environment;
    }

    async getToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        try {
            const response = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                { headers: { Authorization: `Basic ${auth}` } }
            );
            return response.data.access_token;
        } catch (error) {
            throw new Error(`Failed to get M-Pesa token: ${error.message}`);
        }
    }

    getTimestamp() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    generatePassword(timestamp) {
        const str = `${this.shortcode}${this.passkey}${timestamp}`;
        return Buffer.from(str).toString('base64');
    }

    async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
        const token = await this.getToken();
        const timestamp = this.getTimestamp();
        const password = this.generatePassword(timestamp);

        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        }
        if (!formattedPhone.startsWith('254')) {
            formattedPhone = '254' + formattedPhone;
        }

        const requestData = {
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: this.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: this.callbackUrl,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc || 'Boma Yangu Job Application'
        };

        try {
            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            throw new Error(`STK Push failed: ${error.message}`);
        }
    }
}

module.exports = new MpesaService();
