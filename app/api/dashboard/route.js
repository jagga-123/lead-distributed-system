import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import Lead from '@/models/Lead'; // Need to import Lead for populate

export async function GET() {
  try {
    await dbConnect();

    // ensure Lead is registered
    Lead.schema;

    const providers = await Provider.find({}).sort({ providerId: 1 }).lean();
    
    // For each provider, fetch their assignments
    const assignments = await LeadAssignment.find({}).populate('leadId').lean();

    const providerData = providers.map(provider => {
      const providerAssignments = assignments.filter(a => a.providerId === provider.providerId);
      return {
        ...provider,
        remainingQuota: provider.monthlyQuota - provider.usedQuota,
        totalLeadsReceived: provider.usedQuota, // Or providerAssignments.length
        assignedLeads: providerAssignments.map(a => a.leadId)
      };
    });

    return NextResponse.json({ success: true, data: providerData });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
