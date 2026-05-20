import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ensureBootstrapData } from '@/lib/bootstrap';

export async function POST() {
  try {
    await dbConnect();
    const { providersCount, servicesCount, seededNow } = await ensureBootstrapData();

    return NextResponse.json({
      success: true,
      message: seededNow ? 'Database seeded successfully' : 'Database already seeded',
      providersCount,
      servicesConfigured: servicesCount
    }, { status: 200 });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to seed database'
    }, { status: 500 });
  }
}
