import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
import { allocateLead } from '@/lib/allocation';

function isTransactionUnsupported(error) {
  const message = error?.message || '';
  return [
    'Transaction numbers',
    'Transaction',
    'retryable writes',
    'retryWrites',
    'standalone',
  ].some((fragment) => message.includes(fragment));
}

async function processLeadCreation(body, useTransaction) {
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { name, phoneNumber, city, serviceType, description } = body;

    // 1. Create Lead
    const newLead = new Lead({ name, phoneNumber, city, serviceType, description });
    await newLead.save(session ? { session } : {});

    // 2. Allocate Providers
    const assignedProviders = await allocateLead(serviceType, session);

    // 3. Create Assignments
    const assignments = assignedProviders.map(p => ({
      leadId: newLead._id,
      providerId: p.providerId,
      serviceType: serviceType
    }));
    await LeadAssignment.insertMany(assignments, session ? { session } : {});

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return { success: true, lead: newLead, assignedProviders };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    let result;
    try {
      // Attempt with transaction
      result = await processLeadCreation(body, true);
    } catch (txError) {
      // If standalone mongodb, transactions are not supported. Fallback to non-transactional.
      if (isTransactionUnsupported(txError)) {
        console.warn('MongoDB does not support transactions (likely standalone). Retrying without transaction...');
        result = await processLeadCreation(body, false);
      } else {
        throw txError; // Rethrow other errors like duplicate key, quota reached, etc.
      }
    }

    // Fire socket event after success
    if (global.io) {
      global.io.emit('dashboard_update', { message: 'New lead assigned' });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'A lead with this phone number already exists for this service.' }, { status: 400 });
    }

    console.error('Lead creation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
