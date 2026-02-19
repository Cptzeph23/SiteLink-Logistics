/**
 * M-Pesa Daraja API Integration Service
 * Handles STK Push (Lipa Na M-Pesa Online) for construction materials delivery payments
 */

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

class MpesaService {
  private config: MpesaConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '',
      passkey: process.env.MPESA_PASSKEY || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || '',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Generate OAuth access token for M-Pesa API
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64');

    const response = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate M-Pesa access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Generate timestamp in the format YYYYMMDDHHmmss
   */
  private getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(timestamp: string): string {
    const data = `${this.config.businessShortCode}${this.config.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
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

    // Validate format
    if (!/^254[17]\d{8}$/.test(cleaned)) {
      throw new Error('Invalid Kenyan phone number format');
    }

    return cleaned;
  }

  /**
   * Initiate STK Push payment request
   */
  async initiatePayment(request: StkPushRequest): Promise<StkPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);
      const phoneNumber = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(request.amount), // M-Pesa requires whole numbers
        PartyA: phoneNumber,
        PartyB: this.config.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.config.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      };

      const response = await fetch(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || 'M-Pesa STK Push failed');
      }

      const data: StkPushResponse = await response.json();
      
      // ResponseCode "0" means success
      if (data.ResponseCode !== '0') {
        throw new Error(data.ResponseDescription || 'Payment request failed');
      }

      return data;

    } catch (error: any) {
      console.error('M-Pesa payment initiation error:', error);
      throw new Error(error.message || 'Failed to initiate M-Pesa payment');
    }
  }

  /**
   * Query STK Push transaction status
   */
  async queryPaymentStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to query payment status');
      }

      return await response.json();

    } catch (error: any) {
      console.error('M-Pesa query error:', error);
      throw new Error(error.message || 'Failed to query payment status');
    }
  }

  /**
   * Validate M-Pesa callback payload
   */
  validateCallback(callbackData: any): {
    success: boolean;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
    amount?: number;
  } {
    try {
      const body = callbackData.Body?.stkCallback;
      
      if (!body) {
        return { success: false };
      }

      const resultCode = body.ResultCode;
      
      // ResultCode 0 = success, anything else = failure
      if (resultCode !== 0) {
        return { success: false };
      }

      // Extract callback metadata
      const metadata = body.CallbackMetadata?.Item || [];
      const getValue = (name: string) => {
        const item = metadata.find((m: any) => m.Name === name);
        return item?.Value;
      };

      return {
        success: true,
        mpesaReceiptNumber: getValue('MpesaReceiptNumber'),
        transactionDate: getValue('TransactionDate'),
        phoneNumber: getValue('PhoneNumber'),
        amount: getValue('Amount'),
      };

    } catch (error) {
      console.error('Callback validation error:', error);
      return { success: false };
    }
  }
}

// Export singleton instance
export const mpesaService = new MpesaService();