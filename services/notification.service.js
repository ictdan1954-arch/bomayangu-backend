class NotificationService {
    async sendSMS(phone, message) {
        console.log(`📱 SMS to ${phone}: ${message}`);
        return true;
    }

    async sendEmail(email, subject, message) {
        console.log(`📧 Email to ${email}: ${subject}`);
        return true;
    }

    async sendApplicationConfirmation(application) {
        const message = `Your application for ${application.job_title} has been submitted. Keep your documents ready for verification.`;
        if (application.user && application.user.email) {
            await this.sendEmail(application.user.email, 'Application Confirmation', message);
        }
        if (application.user && application.user.phone) {
            await this.sendSMS(application.user.phone, message);
        }
    }

    async sendPaymentConfirmation(application) {
        const message = `Payment confirmed for ${application.job_title}. We'll contact you for verification.`;
        if (application.user && application.user.email) {
            await this.sendEmail(application.user.email, 'Payment Confirmed', message);
        }
        if (application.user && application.user.phone) {
            await this.sendSMS(application.user.phone, message);
        }
    }
}

module.exports = new NotificationService();
