import mongoose from 'mongoose';
import Provider from '../models/Provider.js';
import AllocationState from '../models/AllocationState.js';
import Service from '../models/Service.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/lead-distribution?retryWrites=false';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing providers and states
    await Provider.deleteMany({});
    await Service.deleteMany({});
    await AllocationState.deleteMany({});

    const providers = Array.from({ length: 8 }, (_, i) => ({
      providerId: i + 1,
      name: `Provider ${i + 1}`,
      monthlyQuota: 10,
      usedQuota: 0,
    }));

    await Provider.insertMany(providers);
    console.log('Inserted 8 providers successfully');

    const services = ['Service 1', 'Service 2', 'Service 3'];
    await Service.insertMany(services.map(name => ({ name })));
    console.log('Inserted 3 services successfully');

    // Initialize allocation states for the 3 services
    const allocationStates = services.map(serviceType => ({
      serviceType,
      currentIndex: 0
    }));

    await AllocationState.insertMany(allocationStates);
    console.log('Initialized allocation states for services');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
