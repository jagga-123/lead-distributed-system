import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
import { allocateLead } from '@/lib/allocation';
import Provider from '@/models/Provider';
import { ensureBootstrapData } from '@/lib/bootstrap';
import { runTransactionWithRetry } from '@/lib/transaction';

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

async function processLeadCreation(body, session = null) {
  const { name, phoneNumber, city, serviceType, description } = body;
  const sessionOptions = session ? { session } : {};

  // 1. Create Lead
  const newLead = new Lead({ name, phoneNumber, city, serviceType, description });
  await newLead.save(sessionOptions);

  // 2. Allocate Providers
  const assignedProviders = await allocateLead(serviceType, session);

  // 3. Create Assignments
  const assignments = assignedProviders.map((provider) => ({
    leadId: newLead._id,
    providerId: provider.providerId,
    serviceType,
  }));
  await LeadAssignment.insertMany(assignments, sessionOptions);

  return { success: true, lead: newLead, assignedProviders };
}

export async function POST(request) {
  try {
    await dbConnect();
    const providerCount = await Provider.countDocuments();
    if (providerCount === 0) {
      await ensureBootstrapData();
    }
    const body = await request.json();
    
    let result;
    try {
      result = await runTransactionWithRetry((session) => processLeadCreation(body, session));
    } catch (txError) {
      // If standalone mongodb, transactions are not supported. Fallback to non-transactional.
      if (isTransactionUnsupported(txError)) {
        console.warn('MongoDB does not support transactions (likely standalone). Retrying without transaction...');
        result = await processLeadCreation(body, null);
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
