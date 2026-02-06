import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import * as QRCode from 'qrcode';

export const getRoutes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { from, to, date } = req.query;

    const where: any = { status: 'active' };
    if (from) where.routeFrom = { contains: from as string, mode: 'insensitive' };
    if (to) where.routeTo = { contains: to as string, mode: 'insensitive' };

    const routes = await prisma.shuttleRoute.findMany({
      where,
      orderBy: { departureTime: 'asc' },
    });

    // Calculate available seats for each route
    const routesWithAvailability = await Promise.all(
      routes.map(async (route) => {
        const bookingDate = date ? new Date(date as string) : new Date();
        const bookings = await prisma.shuttleBooking.aggregate({
          where: {
            routeId: route.id,
            bookingDate,
            status: { not: 'cancelled' },
          },
          _sum: { seatsBooked: true },
        });

        const bookedSeats = bookings._sum.seatsBooked || 0;
        const availableSeats = route.totalSeats - bookedSeats;

        return {
          id: route.id,
          from: route.routeFrom,
          to: route.routeTo,
          departureTime: route.departureTime.toISOString().split('T')[1].substring(0, 5),
          arrivalTime: route.arrivalTime.toISOString().split('T')[1].substring(0, 5),
          price: Number(route.pricePerSeat),
          availableSeats,
          totalSeats: route.totalSeats,
          driver: route.driverName,
          vehicle: route.vehicleType,
          frequency: route.frequency,
        };
      })
    );

    return sendSuccess(res, { routes: routesWithAvailability });
  } catch (error) {
    next(error);
  }
};

export const bookShuttle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { routeId, date, seats = 1 } = req.body;
    const userId = req.user!.id;

    const route = await prisma.shuttleRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return sendError(res, 'Route not found', 404);
    }

    const bookingDate = new Date(date);
    
    // Check available seats
    const existingBookings = await prisma.shuttleBooking.aggregate({
      where: {
        routeId,
        bookingDate,
        status: { not: 'cancelled' },
      },
      _sum: { seatsBooked: true },
    });

    const bookedSeats = existingBookings._sum.seatsBooked || 0;
    const availableSeats = route.totalSeats - bookedSeats;

    if (seats > availableSeats) {
      return sendError(res, 'Not enough seats available', 409);
    }

    const totalPrice = Number(route.pricePerSeat) * seats;

    const booking = await prisma.shuttleBooking.create({
      data: {
        userId,
        routeId,
        bookingDate,
        seatsBooked: seats,
        totalPrice,
        status: 'confirmed',
      },
      include: {
        route: true,
      },
    });

    // Generate QR code
    const qrData = JSON.stringify({
      bookingId: booking.id,
      routeId: booking.routeId,
      date: booking.bookingDate.toISOString(),
      seats: booking.seatsBooked,
    });

    const qrCode = await QRCode.toDataURL(qrData);

    await prisma.shuttleBooking.update({
      where: { id: booking.id },
      data: { qrCode },
    });

    return sendSuccess(res, {
      bookingId: booking.id,
      routeId: booking.routeId,
      from: booking.route.routeFrom,
      to: booking.route.routeTo,
      departureTime: booking.route.departureTime.toISOString().split('T')[1].substring(0, 5),
      date: booking.bookingDate.toISOString().split('T')[0],
      seats,
      totalPrice: Number(totalPrice),
      status: booking.status,
      qrCode,
    }, 'Shuttle booked successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.shuttleBooking.findMany({
      where: { userId },
      orderBy: { bookingDate: 'desc' },
      include: {
        route: true,
      },
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      routeId: booking.routeId,
      from: booking.route.routeFrom,
      to: booking.route.routeTo,
      departureTime: booking.route.departureTime.toISOString().split('T')[1].substring(0, 5),
      date: booking.bookingDate.toISOString().split('T')[0],
      seats: booking.seatsBooked,
      totalPrice: Number(booking.totalPrice),
      status: booking.status,
      qrCode: booking.qrCode,
    }));

    return sendSuccess(res, { bookings: formattedBookings });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.shuttleBooking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 'Booking already cancelled', 400);
    }

    await prisma.shuttleBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return sendSuccess(res, {
      refundAmount: Number(booking.totalPrice),
    }, 'Booking cancelled');
  } catch (error) {
    next(error);
  }
};

