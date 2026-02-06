import { config } from '../config/env';

export const generateOTP = (): string => {
  const length = config.OTP_LENGTH;
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

export const getOTPExpiry = (): Date => {
  const expiryMinutes = config.OTP_EXPIRY_MINUTES;
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  return expiry;
};

