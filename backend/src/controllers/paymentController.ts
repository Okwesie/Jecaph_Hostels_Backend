import { Response, NextFunction, Request } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { 
  initializePayment, 
  verifyPayment, 
  generatePaymentReference,
  verifyWebhookSignature,
  parseWebhookEvent
} from '../services/paymentService';
import { sendPaymentReceiptEmail } from '../services/emailService';
import { logger } from '../utils/logger';

export const initializePaymentHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { amount, type: paymentType, reference: referenceId, paymentMethod = 'paystack' } = req.body;
    const userId = req.user!.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Generate payment reference
    const reference = generatePaymentReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentType,
        referenceId,
        transactionReference: reference,
        status: 'pending',
        currency: 'GHS',
      },
    });

    // Initialize payment with Paystack
    const paymentData = await initializePayment({
      email: user.email,
      amount: parseFloat(amount),
      reference,
      callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/payments/verify`,
      metadata: {
        paymentId: payment.id,
        userId,
        paymentType,
      },
    });

    // Update payment with access code
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionReference: paymentData.reference,
      },
    });

    return sendSuccess(res, {
      paymentId: payment.id,
      amount: parseFloat(amount),
      currency: 'GHS',
      status: 'pending',
      paymentLink: paymentData.authorization_url,
      reference: paymentData.reference,
    }, 'Payment initialized');
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentHandler = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return sendError(res, 'Payment reference is required', 400);
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference as string);

    if (!verification.status || verification.data.status !== 'success') {
      return sendError(res, 'Payment verification failed', 400);
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { transactionReference: reference as string },
      include: { user: true, booking: true },
    });

    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }

    if (payment.status === 'completed') {
      return sendSuccess(res, null, 'Payment already verified');
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Update booking if exists
    if (payment.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
      });

      if (booking) {
        const newAmountPaid = Number(booking.amountPaid) + Number(payment.amount);
        const newOutstandingBalance = Number(booking.outstandingBalance) - Number(payment.amount);

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            amountPaid: newAmountPaid,
            outstandingBalance: Math.max(0, newOutstandingBalance),
            status: newOutstandingBalance <= 0 ? 'active' : booking.status,
          },
        });
      }
    }

    // Send receipt email
    try {
      await sendPaymentReceiptEmail(payment.user.email, {
        amount: Number(payment.amount),
        transactionReference: payment.transactionReference!,
        date: new Date().toISOString().split('T')[0],
        bookingId: payment.bookingId || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send payment receipt email:', emailError);
    }

    return sendSuccess(res, null, 'Payment verified and processed');
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { status, startDate, endDate, page = '1' } = req.query;
    const userId = req.user!.id;

    const pageNum = parseInt(page as string, 10);
    const limitNum = 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      type: payment.paymentType,
      reference: payment.referenceId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      date: payment.createdAt.toISOString(),
      receiptUrl: payment.status === 'completed' ? `/api/payments/${payment.id}/receipt` : null,
    }));

    // Calculate summary
    const completedPayments = await prisma.payment.aggregate({
      where: { userId, status: 'completed' },
      _sum: { amount: true },
    });

    const outstandingBookings = await prisma.booking.aggregate({
      where: {
        userId,
        status: { in: ['active', 'approved'] },
      },
      _sum: { outstandingBalance: true },
    });

    return sendSuccess(res, {
      payments: formattedPayments,
      summary: {
        totalPaid: Number(completedPayments._sum.amount || 0),
        outstandingBalance: Number(outstandingBookings._sum.outstandingBalance || 0),
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!.id;

    const [outstandingBookings, lastPayment] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          userId,
          status: { in: ['active', 'approved'] },
        },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          outstandingBalance: true,
        },
      }),
      prisma.payment.findFirst({
        where: { userId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ]);

    const totalOwed = Number(outstandingBookings._sum.totalAmount || 0);
    const amountPaid = Number(outstandingBookings._sum.amountPaid || 0);
    const outstandingBalance = Number(outstandingBookings._sum.outstandingBalance || 0);

    return sendSuccess(res, {
      outstandingBalance,
      totalOwed,
      amountPaid,
      lastPaymentDate: lastPayment?.completedAt || null,
      nextPaymentDue: null, // Can be calculated based on booking dates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Paystack Webhook Handler
 * CRITICAL: Verifies webhook signature to prevent payment fraud
 */
export const paystackWebhookHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get signature from headers
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature) {
      logger.warn('Webhook received without signature');
      return res.status(401).json({ message: 'No signature provided' });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      logger.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Parse webhook event
    const event = parseWebhookEvent(req.body);
    
    if (!event) {
      logger.warn('Invalid webhook event format');
      return res.status(400).json({ message: 'Invalid event format' });
    }

    logger.info(`Received Paystack webhook: ${event.event}`, { reference: event.data.reference });

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data);
        break;
      
      case 'transfer.success':
        logger.info('Transfer successful', { reference: event.data.reference });
        break;
      
      case 'transfer.failed':
        logger.warn('Transfer failed', { reference: event.data.reference });
        break;
      
      default:
        logger.info(`Unhandled webhook event: ${event.event}`);
    }

    // Always respond 200 to Paystack
    return res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Webhook processing error:', error.message);
    // Still return 200 to prevent Paystack from retrying
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
};

/**
 * Handle successful charge webhook
 */
async function handleChargeSuccess(data: any): Promise<void> {
  const { reference, amount, status } = data;
  
  logger.info('Processing successful charge', { reference, amount, status });

  try {
    // Find payment by reference using Prisma
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionReference: reference },
          { transactionReference: reference }
        ]
      },
      include: {
        booking: true,
        user: true
      }
    });

    if (!payment) {
      logger.warn('Payment not found for reference', { reference });
      return;
    }

    if (payment.status === 'completed') {
      logger.info('Payment already processed', { reference });
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Update booking balance (if applicable)
    if (payment.bookingId && payment.booking) {
      const newAmountPaid = Number(payment.booking.amountPaid || 0) + Number(payment.amount);
      const newBalance = Number(payment.booking.totalAmount) - newAmountPaid;

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          amountPaid: newAmountPaid,
          outstandingBalance: Math.max(0, newBalance),
          status: newBalance <= 0 ? 'active' : payment.booking.status
        }
      });
    }

    logger.info('Payment processed successfully via webhook', { reference });
  } catch (error: any) {
    logger.error('Error processing charge success:', error.message);
  }
}

/**
 * Handle failed charge webhook
 */
async function handleChargeFailed(data: any): Promise<void> {
  const { reference, gateway_response } = data;
  
  logger.warn('Processing failed charge', { reference, gateway_response });

  try {
    await prisma.payment.updateMany({
      where: {
        OR: [
          { transactionReference: reference },
          { transactionReference: reference }
        ]
      },
      data: {
        status: 'failed'
      }
    });
  } catch (error: any) {
    logger.error('Error processing charge failure:', error.message);
  }
}

