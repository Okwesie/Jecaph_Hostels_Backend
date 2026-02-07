import { Resend } from 'resend';
import { config } from '../config/env';
import logger from '../utils/logger';

// Use Resend API (works on Render - uses HTTPS, not SMTP)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> => {
  if (!resend) {
    logger.warn(`Email not sent (no RESEND_API_KEY configured). To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${config.EMAIL_FROM_NAME || 'JECAPH Hostels'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      logger.error(`Resend error sending to ${to}:`, error);
      throw new Error(error.message);
    }

    logger.info(`Email sent to ${to}: ${data?.id}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const subject = 'Verify Your Email - JECAPH Hostel Management';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .otp-box { background-color: white; padding: 20px; text-align: center; margin: 20px 0; border: 2px dashed #4F46E5; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JECAPH Hostel Management</h1>
        </div>
        <div class="content">
          <h2>Email Verification</h2>
          <p>Thank you for registering with JECAPH Hostel Management System.</p>
          <p>Please use the following OTP code to verify your email address:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JECAPH Hostel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${config.API_BASE_URL.replace('/api', '')}/auth/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request - JECAPH Hostel Management';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JECAPH Hostel Management</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JECAPH Hostel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

export const sendBookingConfirmationEmail = async (
  email: string,
  bookingDetails: {
    bookingId: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
  }
): Promise<void> => {
  const subject = 'Booking Confirmation - JECAPH Hostel Management';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmation</h1>
        </div>
        <div class="content">
          <h2>Your booking has been confirmed!</h2>
          <div class="details">
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p><strong>Room Number:</strong> ${bookingDetails.roomNumber}</p>
            <p><strong>Check-in Date:</strong> ${bookingDetails.checkInDate}</p>
            <p><strong>Check-out Date:</strong> ${bookingDetails.checkOutDate}</p>
            <p><strong>Total Amount:</strong> GHS ${bookingDetails.totalAmount}</p>
          </div>
          <p>Please make payment to complete your booking. You can view your booking details in your dashboard.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JECAPH Hostel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

export const sendPaymentReceiptEmail = async (
  email: string,
  paymentDetails: {
    amount: number;
    transactionReference: string;
    date: string;
    bookingId?: string;
  }
): Promise<void> => {
  const subject = 'Payment Receipt - JECAPH Hostel Management';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Received</h1>
        </div>
        <div class="content">
          <h2>Thank you for your payment!</h2>
          <div class="details">
            <p><strong>Amount:</strong> GHS ${paymentDetails.amount}</p>
            <p><strong>Transaction Reference:</strong> ${paymentDetails.transactionReference}</p>
            <p><strong>Date:</strong> ${paymentDetails.date}</p>
            ${paymentDetails.bookingId ? `<p><strong>Booking ID:</strong> ${paymentDetails.bookingId}</p>` : ''}
          </div>
          <p>Your payment has been successfully processed. You can download the receipt from your dashboard.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JECAPH Hostel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

