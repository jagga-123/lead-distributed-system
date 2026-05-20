import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { allocateLead } from '@/lib/allocation';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
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

async function createTestLead(index, services) {
  const serviceType = services[index % services.length];
  const phoneNumber = `9${Date.now()}${String(index).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const run = async (session) => {
    const sessionOptions = session ? { session } : {};

    const newLead = new Lead({
      name: `Test Lead ${index + 1}`,
      phoneNumber,
      city: 'Test City',
      serviceType,
      description: 'Auto-generated test lead'
    });

    await newLead.save(sessionOptions);

    const assignedProviders = await allocateLead(serviceType, session);

    const assignments = assignedProviders.map((provider) => ({
      leadId: newLead._id,
      providerId: provider.providerId,
      serviceType,
    }));

    await LeadAssignment.insertMany(assignments, sessionOptions);
    return newLead;
  };

  try {
    return await runTransactionWithRetry((session) => run(session));
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return run(null);
    }

    throw error;
  }
}

export async function POST() {
  try {
    await dbConnect();
    const providerCount = await Provider.countDocuments();
    if (providerCount === 0) {
      await ensureBootstrapData();
    }
    const services = ['Service 1', 'Service 2', 'Service 3'];
    const results = [];

    const promises = Array.from({ length: 10 }, (_, index) => createTestLead(index, services));
    const responses = await Promise.allSettled(promises);

    let successCount = 0;
    let failureCount = 0;

    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        successCount += 1;
        results.push({
          index,
          status: 'success',
          leadId: response.value._id,
          message: 'Lead created successfully'
        });
        return;
      }

      failureCount += 1;
      results.push({
        index,
        status: 'failed',
        error: response.reason?.message || 'Unknown error'
      });
    });

    return NextResponse.json({
      success: true,
      totalAttempted: 10,
      successCount,
      failureCount,
      results
    }, { status: 200 });
  } catch (error) {
    console.error('Generate leads error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate leads' }, { status: 500 });
  }
}
