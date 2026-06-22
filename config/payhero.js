// config/payhero.js
// PayHero API configuration – v2 (official docs)

module.exports = {
    // Authentication credentials (provided by PayHero)
    username: process.env.PAYHERO_USERNAME,
    password: process.env.PAYHERO_PASSWORD,

    // API base URL – production v2
    baseUrl: process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke/api/v2',

    // Endpoint for initiating STK Push (matches v2 docs)
    initiateEndpoint: process.env.PAYHERO_INITIATE_ENDPOINT || '/payments',

    // REQUIRED – your payment channel ID (from PayHero dashboard)
    channelId: process.env.PAYHERO_CHANNEL_ID,

    // Callback URL for payment confirmations
    callbackUrl: process.env.PAYHERO_CALLBACK_URL,

    // Environment (production / development)
    environment: process.env.ENVIRONMENT || 'production'
};
