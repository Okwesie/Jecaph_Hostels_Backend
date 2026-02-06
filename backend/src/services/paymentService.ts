import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';
import logger from '../utils/logger';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackAxios = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface InitializePaymentParams {
  email: string;
  amount: number; // in pesewas (kobo)
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    gateway_response: string;
    customer: {
      email: string;
    };
    metadata?: any;
  };
}

export const initializePayment = async (
  params: InitializePaymentParams
): Promise<{ authorization_url: string; access_code: string; reference: string }> => {
  try {
    const response = await paystackAxios.post('/transaction/initialize', {
      email: params.email,
      amount: params.amount * 100, // Convert to pesewas/kobo
      reference: params.reference,
      callback_url: params.callbackUrl || config.PAYSTACK_CALLBACK_URL,
      metadata: params.metadata,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to initialize payment');
    }

    return {
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error: any) {
    logger.error('Paystack initialization error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to initialize payment');
    }
    throw new Error(error.message || 'Failed to initialize payment');
  }
};

export const verifyPayment = async (reference: string): Promise<VerifyPaymentResponse> => {
  try {
    const response = await paystackAxios.get(`/transaction/verify/${reference}`);
    return response.data as VerifyPaymentResponse;
  } catch (error: any) {
    logger.error('Paystack verification error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to verify payment');
    }
    throw new Error(error.message || 'Failed to verify payment');
  }
};

export const generatePaymentReference = (): string => {
  return `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

/**
 * Verify Paystack webhook signature
 * CRITICAL: Always verify webhooks to prevent payment fraud
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): boolean => {
  if (!config.PAYSTACK_WEBHOOK_SECRET) {
    logger.warn('PAYSTACK_WEBHOOK_SECRET not configured - webhook verification skipped');
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha512', config.PAYSTACK_WEBHOOK_SECRET)
      .update(typeof payload === 'string' ? payload : payload.toString())
      .digest('hex');

    return hash === signature;
  } catch (error: any) {
    logger.error('Webhook signature verification error:', error.message);
    return false;
  }
};

/**
 * Process Paystack webhook event
 */
export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    gateway_response: string;
    paid_at: string;
    customer: {
      email: string;
    };
    metadata?: any;
  };
}

export const parseWebhookEvent = (body: any): PaystackWebhookEvent | null => {
  try {
    if (!body || !body.event || !body.data) {
      return null;
    }
    return body as PaystackWebhookEvent;
  } catch (error) {
    logger.error('Failed to parse webhook event:', error);
    return null;
  }
};
