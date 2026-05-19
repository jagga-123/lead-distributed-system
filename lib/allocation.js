import AllocationState from '@/models/AllocationState';
import Provider from '@/models/Provider';

const SERVICE_CONFIGS = {
  'Service 1': {
    alwaysAssigned: [1],
    pool: [2, 3, 4],
    requiredFromPool: 2
  },
  'Service 2': {
    alwaysAssigned: [5],
    pool: [6, 7, 8],
    requiredFromPool: 2
  },
  'Service 3': {
    alwaysAssigned: [1, 4],
    pool: [2, 3, 5, 6, 7, 8],
    requiredFromPool: 1
  }
};

export const allocateLead = async (serviceType, session) => {
  const config = SERVICE_CONFIGS[serviceType];
  if (!config) throw new Error('Invalid service type');

  const { alwaysAssigned, pool, requiredFromPool } = config;

  // 1. Get Always Assigned Providers
  const alwaysAssignedProviders = await Provider.find({
    providerId: { $in: alwaysAssigned }
  }).session(session);

  // Check Quotas for Always Assigned
  for (const provider of alwaysAssignedProviders) {
    if (provider.usedQuota >= provider.monthlyQuota) {
      throw new Error(`Always-assigned Provider ${provider.providerId} has reached quota`);
    }
  }

  // 2. Get Pool Providers
  const poolProviders = await Provider.find({
    providerId: { $in: pool }
  }).session(session);

  // Filter out providers that have reached quota
  const availablePoolProviders = poolProviders.filter(
    p => p.usedQuota < p.monthlyQuota
  );

  if (availablePoolProviders.length < requiredFromPool) {
    throw new Error('Not enough available providers in the pool to satisfy allocation');
  }

  // 3. Get Allocation State
  let allocationState = await AllocationState.findOne({ serviceType }).session(session);
  if (!allocationState) {
    allocationState = new AllocationState({ serviceType, currentIndex: 0 });
    await allocationState.save({ session });
  }

  const selectedProviders = [];
  const startIndex = allocationState.currentIndex;
  const poolSize = pool.length; // We iterate over the original pool array

  let checkedCount = 0;
  let currentIndex = startIndex;

  while (selectedProviders.length < requiredFromPool && checkedCount < poolSize) {
    const providerId = pool[currentIndex];
    const provider = availablePoolProviders.find(p => p.providerId === providerId);

    if (provider) {
      selectedProviders.push(provider);
    }

    currentIndex = (currentIndex + 1) % poolSize;
    checkedCount++;
  }

  if (selectedProviders.length < requiredFromPool) {
    throw new Error('Failed to find enough providers due to quota constraints');
  }

  // Update allocation state
  allocationState.currentIndex = currentIndex;
  await allocationState.save({ session });

  // Combine and update used quotas
  const allAssigned = [...alwaysAssignedProviders, ...selectedProviders];
  
  for (const p of allAssigned) {
    p.usedQuota += 1;
    await p.save({ session });
  }

  return allAssigned;
};
