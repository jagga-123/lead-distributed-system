import mongoose from 'mongoose';

const ProviderSchema = new mongoose.Schema({
  providerId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  monthlyQuota: { type: Number, required: true, default: 10 },
  usedQuota: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.models.Provider || mongoose.model('Provider', ProviderSchema);
