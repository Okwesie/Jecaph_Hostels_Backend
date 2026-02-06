import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getStatistics = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const [
      totalStudents,
      totalRooms,
      occupiedRooms,
      totalRevenue,
      thisMonthRevenue,
      pendingPayments,
      activeBookings,
      pendingMaintenance,
      openSupportTickets,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'student', status: 'active' } }),
      prisma.room.count({ where: { deletedAt: null } }),
      prisma.room.count({ where: { status: 'occupied', deletedAt: null } }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['active', 'approved'] } },
        _sum: { outstandingBalance: true },
      }),
      prisma.booking.count({ where: { status: 'active' } }),
      prisma.maintenanceRequest.count({ where: { status: 'new' } }),
      prisma.supportTicket.count({ where: { status: 'open' } }),
    ]);

    const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;

    return sendSuccess(res, {
      totalStudents,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      thisMonthRevenue: Number(thisMonthRevenue._sum.amount || 0),
      pendingPayments: Number(pendingPayments._sum.outstandingBalance || 0),
      activeBookings,
      pendingMaintenance,
      openSupportTickets,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { startDate, endDate, type = 'revenue' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    if (type === 'revenue') {
      const payments = await prisma.payment.findMany({
        where: {
          status: 'completed',
          createdAt: { gte: start, lte: end },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      });

      // Group by date
      const revenueByDay = payments.reduce((acc: any, payment) => {
        const date = payment.createdAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date] += Number(payment.amount);
        return acc;
      }, {});

      const revenueArray = Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount,
      }));

      return sendSuccess(res, { revenueByDay: revenueArray });
    }

    return sendSuccess(res, {});
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { search, role, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, {
      users,
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

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      bookings: user.bookings,
      payments: user.payments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return sendSuccess(res, updated, 'User updated');
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const settings = await prisma.systemSetting.findMany();

    const settingsObj: any = {
      general: {},
      hostel: {},
      notifications: {},
      security: {},
    };

    settings.forEach((setting) => {
      const [category, key] = setting.settingKey.split('.');
      if (settingsObj[category]) {
        settingsObj[category][key] = setting.settingValue;
      }
    });

    return sendSuccess(res, settingsObj);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const settings = req.body;

    for (const [category, values] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(values as any)) {
        await prisma.systemSetting.upsert({
          where: { settingKey: `${category}.${key}` },
          update: { settingValue: String(value) },
          create: {
            settingKey: `${category}.${key}`,
            settingValue: String(value),
            settingType: typeof value === 'number' ? 'number' : 'string',
          },
        });
      }
    }

    return sendSuccess(res, null, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

