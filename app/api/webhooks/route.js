import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WebhookLog from '@/models/WebhookLog';
import Provider from '@/models/Provider';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { eventId, eventType, payload } = body;

    if (!eventId || !eventType) {
      return NextResponse.json({ success: false, error: 'eventId and eventType are required' }, { status: 400 });
    }

    if (eventType !== 'RESET_QUOTA') {
      return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 });
    }

    // 1. Claim the event atomically so repeated webhook calls do not re-run
    // the side effect.
    const claimResult = await WebhookLog.updateOne(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          eventType,
          payload,
        },
      },
      { upsert: true }
    );

    if (!claimResult.upsertedCount) {
      return NextResponse.json({ success: true, message: 'Webhook already processed (Idempotency check passed)' }, { status: 200 });
    }

    // 2. Process Webhook Event
    await Provider.updateMany({}, { $set: { usedQuota: 0 } });

    // Fire socket event
    if (global.io) {
      global.io.emit('dashboard_update', { message: 'Quota reset via webhook' });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
