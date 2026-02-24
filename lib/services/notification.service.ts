/**
 * Notification Service
 * Handles SMS and email notifications for job updates
 * Uses Africa's Talking API for SMS (popular in Kenya)
 */

interface SmsOptions {
  to: string; // Phone number in format 254XXXXXXXXX
  message: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  message: string;
}

class NotificationService {
  private apiKey: string;
  private username: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY || '';
    this.username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      console.warn('⚠️  Africa\'s Talking API not configured - notifications disabled');
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and plus signs
    let cleaned = phone.replace(/[\s\-\+]/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If doesn't start with 254, prepend it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    // Add + prefix for Africa's Talking
    return '+' + cleaned;
  }

  /**
   * Send SMS notification
   */
  async sendSMS(options: SmsOptions): Promise<boolean> {
    if (!this.enabled) {
      console.log('📱 [MOCK SMS]', options.to, ':', options.message);
      return true;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(options.to);

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: this.username,
          to: formattedPhone,
          message: options.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ SMS sent:', formattedPhone);
      return true;

    } catch (error: any) {
      console.error('❌ SMS failed:', error.message);
      return false;
    }
  }

  /**
   * Send email notification (using simple SMTP or Resend)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // For now, just log (you can integrate Resend, SendGrid, or AWS SES)
    console.log('📧 [EMAIL]', options.to);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    return true;
  }

  /**
   * Notify client: Job accepted by driver
   */
  async notifyJobAccepted(params: {
    clientPhone: string;
    clientEmail: string;
    jobNumber: string;
    driverName: string;
  }) {
    const message = `SiteLink: Your job ${params.jobNumber} has been accepted by ${params.driverName}. Track your delivery at sitelink.co.ke`;
    
    await Promise.all([
      this.sendSMS({ to: params.clientPhone, message }),
      this.sendEmail({
        to: params.clientEmail,
        subject: `Job ${params.jobNumber} Accepted`,
        message,
      }),
    ]);
  }

  /**
   * Notify client: Driver started trip
   */
  async notifyTripStarted(params: {
    clientPhone: string;
    clientEmail: string;
    jobNumber: string;
  }) {
    const message = `SiteLink: Your materials are on the way! Job ${params.jobNumber} is in transit. Track live at sitelink.co.ke`;
    
    await Promise.all([
      this.sendSMS({ to: params.clientPhone, message }),
      this.sendEmail({
        to: params.clientEmail,
        subject: `Materials On The Way - ${params.jobNumber}`,
        message,
      }),
    ]);
  }

  /**
   * Notify client: Delivery completed
   */
  async notifyDeliveryComplete(params: {
    clientPhone: string;
    clientEmail: string;
    jobNumber: string;
    totalAmount: number;
  }) {
    const message = `SiteLink: Job ${params.jobNumber} delivered! Amount: KSh ${params.totalAmount.toLocaleString()}. Pay now via M-Pesa at sitelink.co.ke`;
    
    await Promise.all([
      this.sendSMS({ to: params.clientPhone, message }),
      this.sendEmail({
        to: params.clientEmail,
        subject: `Delivery Complete - ${params.jobNumber}`,
        message,
      }),
    ]);
  }

  /**
   * Notify driver: New job available nearby
   */
  async notifyNewJobAvailable(params: {
    driverPhone: string;
    jobNumber: string;
    pickup: string;
    delivery: string;
    amount: number;
  }) {
    const message = `SiteLink: New job ${params.jobNumber} available! ${params.pickup} → ${params.delivery}. Earn KSh ${params.amount.toLocaleString()}. Check app now!`;
    
    await this.sendSMS({ to: params.driverPhone, message });
  }

  /**
   * Notify client: Payment received
   */
  async notifyPaymentReceived(params: {
    clientPhone: string;
    clientEmail: string;
    jobNumber: string;
    receiptNumber: string;
    amount: number;
  }) {
    const message = `SiteLink: Payment received! Job ${params.jobNumber}, Receipt: ${params.receiptNumber}, Amount: KSh ${params.amount.toLocaleString()}. Thank you!`;
    
    await Promise.all([
      this.sendSMS({ to: params.clientPhone, message }),
      this.sendEmail({
        to: params.clientEmail,
        subject: `Payment Confirmed - ${params.jobNumber}`,
        message,
      }),
    ]);
  }

  /**
   * Notify driver: Return trip opportunity
   */
  async notifyReturnTripAvailable(params: {
    driverPhone: string;
    pickup: string;
    delivery: string;
    amount: number;
    discount: number;
  }) {
    const discountedAmount = params.amount * (1 - params.discount);
    const message = `SiteLink: Return trip available! ${params.pickup} → ${params.delivery}. Earn KSh ${discountedAmount.toLocaleString()} (${params.discount * 100}% discount applied). Accept now!`;
    
    await this.sendSMS({ to: params.driverPhone, message });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();