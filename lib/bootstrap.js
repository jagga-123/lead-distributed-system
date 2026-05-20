import AllocationState from '@/models/AllocationState';
import Provider from '@/models/Provider';
import Service from '@/models/Service';

const DEFAULT_SERVICES = ['Service 1', 'Service 2', 'Service 3'];

async function ensureServices() {
  await Promise.all(DEFAULT_SERVICES.map((name) => (
    Service.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true }
    )
  )));
}

async function ensureAllocationStates() {
  await Promise.all(DEFAULT_SERVICES.map((serviceType) => (
    AllocationState.updateOne(
      { serviceType },
      { $setOnInsert: { serviceType, currentIndex: 0 } },
      { upsert: true }
    )
  )));
}

async function ensureProviders() {
  const existingProviders = await Provider.countDocuments();

  if (existingProviders > 0) {
    return existingProviders;
  }

  const providers = Array.from({ length: 8 }, (_, index) => ({
    providerId: index + 1,
    name: `Provider ${index + 1}`,
    monthlyQuota: 10,
    usedQuota: 0,
  }));

  await Provider.insertMany(providers);
  return providers.length;
}

export async function ensureBootstrapData() {
  const providersCount = await ensureProviders();

  await ensureServices();
  await ensureAllocationStates();

  return {
    providersCount,
    servicesCount: DEFAULT_SERVICES.length,
  };
}
