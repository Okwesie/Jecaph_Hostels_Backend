import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { sendBookingConfirmationEmail } from '../services/emailService';

const calculateDurationMonths = (checkIn: Date, checkOut: Date): number => {
  const months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + (checkOut.getMonth() - checkIn.getMonth());
  return Math.max(1, months);
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { roomId, checkInDate, checkOutDate, notes } = req.body;
    const userId = req.user!.id;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn < new Date()) {
      return sendError(res, 'Check-in date cannot be in the past', 400);
    }

    if (checkOut <= checkIn) {
      return sendError(res, 'Check-out date must be after check-in date', 400);
    }

    const durationMonths = calculateDurationMonths(checkIn, checkOut);
    if (durationMonths < 1) {
      return sendError(res, 'Minimum booking duration is 1 month', 400);
    }

    // Get room
    const room = await prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
    });

    if (!room) {
      return sendError(res, 'Room not found', 404);
    }

    if (room.status !== 'available') {
      throw new ConflictError('Room is not available');
    }

    // Check for date conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ['pending', 'approved', 'active'] },
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkOut } },
              { checkOutDate: { gte: checkIn } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictError('Room is already booked for the selected dates');
    }

    // Calculate total amount
    const totalAmount = Number(room.pricePerMonth) * durationMonths;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        durationMonths,
        totalAmount,
        outstandingBalance: totalAmount,
        status: 'pending',
        notes,
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            roomType: true,
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(booking.user.email, {
        bookingId: booking.id,
        roomNumber: booking.room.roomNumber,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        totalAmount: Number(totalAmount),
      });
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
    }

    return sendSuccess(
      res,
      {
        id: booking.id,
        roomId: booking.roomId,
        studentId: booking.userId,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        duration: durationMonths,
        status: booking.status,
        totalAmount: Number(totalAmount),
        createdAt: booking.createdAt,
      },
      'Booking created successfully',
      201
    );
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const userId = req.user!.id;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            select: {
              roomNumber: true,
              roomType: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType,
      checkInDate: booking.checkInDate.toISOString().split('T')[0],
      checkOutDate: booking.checkOutDate.toISOString().split('T')[0],
      duration: booking.durationMonths,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      amountPaid: Number(booking.amountPaid),
      outstandingBalance: Number(booking.outstandingBalance),
      createdAt: booking.createdAt,
    }));

    return sendSuccess(res, {
      bookings: formattedBookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    return sendSuccess(res, {
      id: booking.id,
      roomId: booking.roomId,
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType,
      studentId: booking.userId,
      studentName: `${booking.user.firstName} ${booking.user.lastName}`,
      checkInDate: booking.checkInDate.toISOString().split('T')[0],
      checkOutDate: booking.checkOutDate.toISOString().split('T')[0],
      duration: booking.durationMonths,
      totalAmount: Number(booking.totalAmount),
      amountPaid: Number(booking.amountPaid),
      outstandingBalance: Number(booking.outstandingBalance),
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id, deletedAt: null },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
      },
    });

    return sendSuccess(res, updatedBooking, 'Booking status updated');
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findFirst({
      where: { id, deletedAt: null },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Check authorization (student who booked or admin)
    if (booking.userId !== userId && !['admin', 'super_admin'].includes(req.user!.role)) {
      return sendError(res, 'You do not have permission to cancel this booking', 403);
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(booking.status)) {
      return sendError(res, 'Booking cannot be cancelled', 400);
    }

    // Calculate refund (full refund for now)
    const refundAmount = Number(booking.amountPaid);

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return sendSuccess(res, {
      refundAmount,
      refundDate: new Date().toISOString().split('T')[0],
    }, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

