import mongoose from 'mongoose';
import AllocationState from '@/models/AllocationState';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
import Provider from '@/models/Provider';
import Service from '@/models/Service';
import WebhookLog from '@/models/WebhookLog';

export function buildMongoUri(rawUri = process.env.MONGODB_URI) {
  if (!rawUri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production. Use your MongoDB Atlas connection string.');
    }

    rawUri = 'mongodb://127.0.0.1:27017/lead-distribution?retryWrites=false';
  }

  const uri = new URL(rawUri);
  const isSrv = uri.protocol === 'mongodb+srv:';
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(uri.hostname);
  const isStandaloneLike = !isSrv && !uri.searchParams.has('replicaSet');

  if (isLocalhost || isStandaloneLike) {
    uri.searchParams.set('retryWrites', 'false');
  }

  if (isLocalhost && !uri.searchParams.has('directConnection')) {
    uri.searchParams.set('directConnection', 'true');
  }

  return uri.toString();
}

const MONGODB_URI = buildMongoUri();

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let indexesPromise = global.mongooseIndexesPromise;
if (!indexesPromise) {
  indexesPromise = global.mongooseIndexesPromise = null;
}

async function ensureIndexes() {
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      Lead.init(),
      LeadAssignment.init(),
      Provider.init(),
      Service.init(),
      AllocationState.init(),
      WebhookLog.init(),
    ]).catch((error) => {
      indexesPromise = null;
      global.mongooseIndexesPromise = null;
      throw error;
    });

    global.mongooseIndexesPromise = indexesPromise;
  }

  return indexesPromise;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isLocalConnection = MONGODB_URI.startsWith('mongodb://127.0.0.1') || MONGODB_URI.startsWith('mongodb://localhost');
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: !isLocalConnection,
      directConnection: isLocalConnection || undefined,
    };

    console.log('🔌 Attempting MongoDB connection...');

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
          console.error('💡 MongoDB is not running. Start it with: mongod');
        }
        if (error.message.includes('retryWrites')) {
          console.error('💡 retryWrites issue - check your connection string and restart the dev server');
        }

        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    await ensureIndexes();
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
