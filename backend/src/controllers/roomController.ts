import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getRooms = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const {
      search,
      type,
      minPrice,
      maxPrice,
      amenities,
      status,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { roomNumber: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { features: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.roomType = type;
    }

    if (minPrice || maxPrice) {
      where.pricePerMonth = {};
      if (minPrice) where.pricePerMonth.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerMonth.lte = parseFloat(maxPrice as string);
    }

    if (amenities) {
      const amenitiesArray = (amenities as string).split(',');
      where.amenities = { hasEvery: amenitiesArray };
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { pricePerMonth: 'asc' };
    if (sort === 'price_desc') orderBy = { pricePerMonth: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    // Get rooms and total count
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          capacity: true,
          pricePerMonth: true,
          currentOccupancy: true,
          amenities: true,
          imageUrl: true,
          status: true,
          features: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.room.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, {
      rooms,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        roomNumber: true,
        roomType: true,
        capacity: true,
        pricePerMonth: true,
        currentOccupancy: true,
        amenities: true,
        imageUrl: true,
        status: true,
        features: true,
        description: true,
        createdAt: true,
      },
    });

    if (!room) {
      return sendError(res, 'Room not found', 404);
    }

    const availableBeds = room.capacity - room.currentOccupancy;

    return sendSuccess(res, {
      ...room,
      availableBeds,
    });
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const {
      roomNumber,
      type: roomType,
      capacity,
      pricePerMonth,
      amenities,
      status,
      description,
      features,
    } = req.body;

    // Check if room number already exists
    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber },
    });

    if (existingRoom) {
      throw new ConflictError('Room number already exists');
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        roomType,
        capacity: parseInt(capacity),
        pricePerMonth: parseFloat(pricePerMonth),
        amenities: amenities || [],
        status: status || 'available',
        description,
        features,
        currentOccupancy: 0,
      },
      select: {
        id: true,
        roomNumber: true,
        roomType: true,
        pricePerMonth: true,
      },
    });

    return sendSuccess(res, room, 'Room created successfully', 201);
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

export const updateRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const {
      roomNumber,
      type: roomType,
      capacity,
      pricePerMonth,
      amenities,
      status,
      description,
      features,
    } = req.body;

    // Check if room exists
    const existingRoom = await prisma.room.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingRoom) {
      return sendError(res, 'Room not found', 404);
    }

    // Check if room number conflict (if changing room number)
    if (roomNumber && roomNumber !== existingRoom.roomNumber) {
      const roomWithNumber = await prisma.room.findUnique({
        where: { roomNumber },
      });

      if (roomWithNumber && roomWithNumber.id !== id) {
        throw new ConflictError('Room number already exists');
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(roomNumber && { roomNumber }),
        ...(roomType && { roomType }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(pricePerMonth && { pricePerMonth: parseFloat(pricePerMonth) }),
        ...(amenities !== undefined && { amenities }),
        ...(status && { status }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
      },
    });

    return sendSuccess(res, room, 'Room updated successfully');
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    // Check if room exists
    const room = await prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: {
        bookings: {
          where: {
            status: { in: ['pending', 'approved', 'active'] },
          },
        },
      },
    });

    if (!room) {
      return sendError(res, 'Room not found', 404);
    }

    // Check if room has active bookings
    if (room.bookings.length > 0) {
      throw new ConflictError('Cannot delete room with active bookings');
    }

    // Soft delete
    await prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return sendSuccess(res, null, 'Room deleted successfully');
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

