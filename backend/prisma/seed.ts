import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create campus
  const campus = await prisma.campus.upsert({
    where: { name: 'Takoradi Campus' },
    update: {},
    create: {
      name: 'Takoradi Campus',
      location: 'Takoradi, Western Region',
      address: 'KNUST Road, Takoradi',
      description: 'Our main operational campus with modern facilities and excellent amenities',
      capacity: 200,
      totalRooms: 45,
      status: 'active',
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jecaph.edu' },
    update: {},
    create: {
      email: 'admin@jecaph.edu',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      campusId: campus.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample rooms
  const rooms = [
    {
      roomNumber: '101',
      roomType: 'single',
      capacity: 1,
      pricePerMonth: 500,
      amenities: ['wifi', 'ac', 'desk', 'bed'],
      description: 'Single room on first floor',
      features: 'Spacious with window view',
      status: 'available',
    },
    {
      roomNumber: '102',
      roomType: 'single',
      capacity: 1,
      pricePerMonth: 500,
      amenities: ['wifi', 'ac', 'desk', 'bed'],
      description: 'Single room on first floor',
      features: 'Modern facilities',
      status: 'available',
    },
    {
      roomNumber: '201',
      roomType: 'shared',
      capacity: 2,
      pricePerMonth: 350,
      amenities: ['wifi', 'ac', 'desk'],
      description: 'Shared room on second floor',
      features: 'Two beds, shared facilities',
      status: 'available',
    },
    {
      roomNumber: '202',
      roomType: 'shared',
      capacity: 2,
      pricePerMonth: 350,
      amenities: ['wifi', 'ac', 'desk'],
      description: 'Shared room on second floor',
      features: 'Recently renovated',
      status: 'available',
    },
    {
      roomNumber: '301',
      roomType: 'suite',
      capacity: 3,
      pricePerMonth: 450,
      amenities: ['wifi', 'ac', 'desk', 'bathroom'],
      description: 'Suite on third floor',
      features: 'Private bathroom, three beds',
      status: 'available',
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: room,
    });
  }

  console.log(`Created ${rooms.length} rooms`);

  // Create system settings
  const settings = [
    { key: 'app_name', value: 'JECAPH Hostel Management', type: 'string' },
    { key: 'support_email', value: 'support@jecaph.edu', type: 'string' },
    { key: 'support_phone', value: '+233 XX XXXX XXXX', type: 'string' },
    { key: 'hostel_name', value: 'JECAPH Hostel', type: 'string' },
    { key: 'semester_start_date', value: '2024-01-15', type: 'date' },
    { key: 'semester_end_date', value: '2024-06-30', type: 'date' },
    { key: 'base_monthly_fee', value: '500', type: 'number' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.key },
      update: { settingValue: setting.value },
      create: {
        settingKey: setting.key,
        settingValue: setting.value,
        settingType: setting.type as any,
      },
    });
  }

  console.log(`Created ${settings.length} system settings`);

  // Create sample shuttle routes
  const shuttleRoutes = [
    {
      routeFrom: 'Campus',
      routeTo: 'City Center',
      departureTime: new Date('1970-01-01T08:00:00'),
      arrivalTime: new Date('1970-01-01T08:45:00'),
      pricePerSeat: 10,
      totalSeats: 20,
      driverName: 'James Mensah',
      vehicleType: 'Toyota Hiace',
      frequency: 'Daily',
      status: 'active',
    },
    {
      routeFrom: 'City Center',
      routeTo: 'Campus',
      departureTime: new Date('1970-01-01T17:00:00'),
      arrivalTime: new Date('1970-01-01T17:45:00'),
      pricePerSeat: 10,
      totalSeats: 20,
      driverName: 'James Mensah',
      vehicleType: 'Toyota Hiace',
      frequency: 'Daily',
      status: 'active',
    },
  ];

  for (const route of shuttleRoutes) {
    await prisma.shuttleRoute.create({
      data: route,
    });
  }

  console.log(`Created ${shuttleRoutes.length} shuttle routes`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

