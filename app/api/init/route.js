import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ensureBootstrapData } from '@/lib/bootstrap';

export async function POST() {
  try {
    await dbConnect();
    const { providersCount, servicesCount } = await ensureBootstrapData();

    return NextResponse.json({
      success: true,
      message: providersCount > 0 ? 'Database already seeded' : 'Database seeded successfully',
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
