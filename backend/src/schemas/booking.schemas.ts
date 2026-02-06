import { z } from 'zod';

export const bookingCreateSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  check_in_date: z.string().refine((date) => {
    const checkIn = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkIn >= today;
  }, 'Check-in date must be today or in the future'),
  check_out_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  emergency_contact_name: z.string().min(2).max(100).optional(),
  emergency_contact_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  special_requests: z.string().max(500).optional(),
  terms_accepted: z.literal(true, { 
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  })
}).refine((data) => {
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const diffMonths = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + 
                     (checkOut.getMonth() - checkIn.getMonth());
  return diffMonths >= 1;
}, {
  message: 'Minimum booking duration is 1 month',
  path: ['check_out_date']
});

export const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'active', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  version: z.number().int().positive()
}).refine((data) => Object.keys(data).filter(k => k !== 'version').length > 0, {
  message: 'At least one field must be provided for update'
});

export const bookingQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'active', 'completed', 'cancelled']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
});
