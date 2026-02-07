import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateOTP, getOTPExpiry } from '../utils/otp';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/emailService';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Accept multiple field name formats from frontend
    let firstName = req.body.firstName || req.body.first_name || req.body.firstname || '';
    let lastName = req.body.lastName || req.body.last_name || req.body.lastname || '';

    // Handle "name" or "fullName" as a single field
    if (!firstName && !lastName) {
      const fullName = req.body.name || req.body.fullName || req.body.full_name || '';
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || 'User';
      lastName = parts.slice(1).join(' ') || 'Account';
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendError(res, 'Password validation failed', 400, 
        passwordValidation.errors.map(err => ({ field: 'password', message: err }))
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName: (firstName || 'User').trim(),
        lastName: (lastName || 'Account').trim(),
        role: 'student',
        status: 'active',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
      },
    });

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiry();

    await prisma.otpCode.create({
      data: {
        email: user.email,
        otpCode,
        expiresAt,
      },
    });

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otpCode);
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('Failed to send OTP email:', emailError);
    }

    return sendSuccess(
      res,
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      'Account created successfully. Please verify your email.',
      201
    );
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return sendError(res, 'Please verify your email before logging in', 403);
    }

    // Check if account is active
    if (user.status !== 'active') {
      return sendError(res, 'Account is suspended or inactive', 403);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour in seconds
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.emailVerified) {
      return sendError(res, 'Email already verified', 400);
    }

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        otpCode: otp,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: true,
        },
      },
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.emailVerified) {
      return sendError(res, 'Email already verified', 400);
    }

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: {
        email: email.toLowerCase(),
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiry();

    await prisma.otpCode.create({
      data: {
        email: user.email,
        otpCode,
        expiresAt,
      },
    });

    // Send OTP email
    await sendOTPEmail(user.email, otpCode);

    return sendSuccess(res, null, 'OTP sent to your email');
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(user.role)) {
      return sendError(res, 'Access denied. Admin privileges required.', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (user.status !== 'active') {
      return sendError(res, 'Account is suspended or inactive', 403);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    // Verify token (validates token format and expiration)
    verifyToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    if (tokenRecord.user.status !== 'active') {
      return sendError(res, 'Account is suspended', 403);
    }

    // Generate new access token
    const tokenPayload = {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return sendSuccess(res, {
      accessToken,
      expiresIn: 3600,
    });
  } catch (error: any) {
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists for security
    if (!user) {
      return sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 1 hour

    // Delete old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    return sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { token, newPassword } = req.body;

    // Validate password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return sendError(res, 'Password validation failed', 400,
        passwordValidation.errors.map(err => ({ field: 'newPassword', message: err }))
      );
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

