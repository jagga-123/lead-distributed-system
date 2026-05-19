import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AllocationState from '@/models/AllocationState';
import Provider from '@/models/Provider';
import Service from '@/models/Service';

async function ensureAllocationStates() {
  const services = ['Service 1', 'Service 2', 'Service 3'];

  await Promise.all(services.map((serviceType) => (
    AllocationState.updateOne(
      { serviceType },
      { $setOnInsert: { serviceType, currentIndex: 0 } },
      { upsert: true }
    )
  )));
}

async function ensureServices() {
  const services = ['Service 1', 'Service 2', 'Service 3'];

  await Promise.all(services.map((name) => (
    Service.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true }
    )
  )));
}

export async function POST() {
  await dbConnect();

  try {
    const existingProviders = await Provider.countDocuments();

    if (existingProviders > 0) {
      await ensureServices();
      await ensureAllocationStates();

      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        providersCount: existingProviders
      }, { status: 200 });
    }

    const providers = Array.from({ length: 8 }, (_, index) => ({
      providerId: index + 1,
      name: `Provider ${index + 1}`,
      monthlyQuota: 10,
      usedQuota: 0,
    }));

    await Provider.insertMany(providers);
    console.log('✅ Inserted 8 providers');

    await ensureServices();
    console.log('✅ Seeded services');

    await ensureAllocationStates();
    console.log('✅ Initialized allocation states');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      providersInserted: 8,
      servicesConfigured: 3
    }, { status: 200 });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to seed database'
    }, { status: 500 });
  }
}
