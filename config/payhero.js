// config/payhero.js
// PayHero API configuration

module.exports = {
    // Authentication credentials
    username: process.env.PAYHERO_USERNAME,
    password: process.env.PAYHERO_PASSWORD,
    accountId: process.env.PAYHERO_ACCOUNT_ID || '10024',

    // API base URL – adjust if the actual one is different
    baseUrl: process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke/api/v1',

    // Public payment page (shown to users as a fallback)
    publicPaymentUrl: 'https://lipwa.link/10024',

    // API endpoint for initiating STK Push
    initiateEndpoint: process.env.PAYHERO_INITIATE_ENDPOINT || '/payments/request',

    // Callback URL for payment confirmations
    callbackUrl: process.env.PAYHERO_CALLBACK_URL,

    // Environment
    environment: process.env.ENVIRONMENT || 'production'
};
