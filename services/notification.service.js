// services/notification.service.js
// Handles sending SMS and email notifications to applicants.

// ---------- DEPENDENCIES ----------
// Uncomment and install the provider packages you need:
// const twilio = require('twilio');
// const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        // ---------- SMS CONFIGURATION ----------
        this.smsProvider = process.env.SMS_PROVIDER || 'log'; // 'twilio', 'africastalking', 'vonage', 'log'
        this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.africasTalkingUsername = process.env.AFRICAS_TALKING_USERNAME;
        this.africasTalkingApiKey = process.env.AFRICAS_TALKING_API_KEY;
        this.vonageApiKey = process.env.VONAGE_API_KEY;
        this.vonageApiSecret = process.env.VONAGE_API_SECRET;

        // ---------- EMAIL CONFIGURATION ----------
        this.emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
        this.emailPort = process.env.EMAIL_PORT || 587;
        this.emailUser = process.env.EMAIL_USER;
        this.emailPassword = process.env.EMAIL_PASSWORD;
        this.emailFrom = process.env.EMAIL_FROM || this.emailUser || 'noreply@bomayangu.go.ke';

        // Initialize clients if credentials exist
        this.emailEnabled = !!(this.emailUser && this.emailPassword);
        this.smsEnabled = this.initSmsClient();

        console.log(`📨 Notification service initialized. SMS: ${this.smsEnabled ? 'ENABLED' : 'DISABLED (logging only)'}`);
        console.log(`📧 Email: ${this.emailEnabled ? 'ENABLED' : 'DISABLED'}`);
    }

    // ---------- INITIALIZE SMS CLIENT ----------
    initSmsClient() {
        if (this.smsProvider === 'twilio' && this.twilioAccountSid && this.twilioAuthToken) {
            try {
                // this.twilioClient = twilio(this.twilioAccountSid, this.twilioAuthToken);
                return true;
            } catch (error) {
                console.warn('⚠️ Failed to initialize Twilio client:', error.message);
                return false;
            }
        }
        if (this.smsProvider === 'africastalking' && this.africasTalkingApiKey) {
            // const AfricasTalking = require('africastalking');
            // this.atClient = AfricasTalking({ apiKey: this.africasTalkingApiKey, username: this.africasTalkingUsername || 'sandbox' });
            return true;
        }
        if (this.smsProvider === 'vonage' && this.vonageApiKey) {
            // const vonage = require('@vonage/server-sdk');
            // this.vonageClient = new vonage({ apiKey: this.vonageApiKey, apiSecret: this.vonageApiSecret });
            return true;
        }
        return false;
    }

    // ---------- SEND SMS ----------
    async sendSMS(phone, message) {
        const formattedPhone = this.formatPhoneNumber(phone);
        console.log(`📱 Sending SMS to ${formattedPhone}: ${message.substring(0, 50)}...`);

        if (!this.smsEnabled) {
            console.log(`📱 [SIMULATED] SMS to ${formattedPhone}: ${message}`);
            return { success: true, simulated: true };
        }

        try {
            if (this.smsProvider === 'twilio' && this.twilioClient) {
                // const result = await this.twilioClient.messages.create({
                //     body: message,
                //     from: this.twilioPhoneNumber,
                //     to: formattedPhone
                // });
                // return { success: true, sid: result.sid };
                console.log(`📱 [TWILIO] SMS sent to ${formattedPhone}`);
                return { success: true };
            }

            if (this.smsProvider === 'africastalking' && this.atClient) {
                // const result = await this.atClient.SMS.send({
                //     to: [formattedPhone],
                //     message: message,
                //     from: this.atSenderId || 'BOMA-YANGU'
                // });
                // return { success: true, data: result };
                console.log(`📱 [AFRICASTALKING] SMS sent to ${formattedPhone}`);
                return { success: true };
            }

            if (this.smsProvider === 'vonage' && this.vonageClient) {
                // const result = await this.vonageClient.sms.send({
                //     from: 'BomaYangu',
                //     to: formattedPhone,
                //     text: message
                // });
                // return { success: true, data: result };
                console.log(`📱 [VONAGE] SMS sent to ${formattedPhone}`);
                return { success: true };
            }

            console.log(`📱 [SIMULATED] SMS to ${formattedPhone}: ${message}`);
            return { success: true, simulated: true };

        } catch (error) {
            console.error(`❌ SMS send error to ${formattedPhone}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // ---------- SEND EMAIL ----------
    async sendEmail(email, subject, message) {
        console.log(`📧 Sending email to ${email}: ${subject}`);

        if (!this.emailEnabled) {
            console.log(`📧 [SIMULATED] Email to ${email}: ${subject}`);
            return { success: true, simulated: true };
        }

        try {
            // const transporter = nodemailer.createTransport({
            //     host: this.emailHost,
            //     port: this.emailPort,
            //     secure: this.emailPort === 465,
            //     auth: { user: this.emailUser, pass: this.emailPassword }
            // });
            // const info = await transporter.sendMail({
            //     from: this.emailFrom,
            //     to: email,
            //     subject: subject,
            //     text: message,
            //     html: `<p>${message.replace(/\n/g, '<br>')}</p>`
            // });
            // return { success: true, messageId: info.messageId };

            console.log(`📧 [SIMULATED] Email to ${email}: ${subject}`);
            return { success: true, simulated: true };

        } catch (error) {
            console.error(`❌ Email send error to ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // ---------- HELPER: FORMAT PHONE NUMBER ----------
    formatPhoneNumber(phone) {
        if (!phone) return phone;
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }
        return cleaned;
    }

    // ---------- NOTIFICATION FLOWS ----------
    async sendApplicationConfirmation(application) {
        try {
            const message = `Dear ${application.User?.full_name || 'Applicant'},\n\nYour application for the position of "${application.job_title}" has been received successfully.\n\nPlease keep your documents ready for verification. You will receive a payment confirmation once your application fee is processed.\n\nThank you for applying through Boma Yangu Jobs.`;
            const emailSubject = 'Application Confirmation - Boma Yangu Jobs';

            if (application.User?.email) {
                await this.sendEmail(application.User.email, emailSubject, message);
            }
            if (application.User?.phone) {
                await this.sendSMS(application.User.phone, message);
            }
            return { success: true };
        } catch (error) {
            console.error('❌ Application confirmation error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendPaymentConfirmation(application) {
        try {
            const message = `Dear ${application.User?.full_name || 'Applicant'},\n\nPayment of KES ${application.amount || 78} for your application to "${application.job_title}" has been confirmed.\n\nWe will contact you shortly regarding the next steps, including verification and interviews.\n\nThank you for choosing Boma Yangu Jobs.`;
            const emailSubject = 'Payment Confirmed - Boma Yangu Jobs';

            if (application.User?.email) {
                await this.sendEmail(application.User.email, emailSubject, message);
            }
            if (application.User?.phone) {
                await this.sendSMS(application.User.phone, message);
            }
            return { success: true };
        } catch (error) {
            console.error('❌ Payment confirmation error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendCustomNotification(user, subject, message, type = 'both') {
        try {
            if (type === 'sms' || type === 'both') {
                if (user.phone) await this.sendSMS(user.phone, message);
            }
            if (type === 'email' || type === 'both') {
                if (user.email) await this.sendEmail(user.email, subject, message);
            }
            return { success: true };
        } catch (error) {
            console.error('❌ Custom notification error:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();
