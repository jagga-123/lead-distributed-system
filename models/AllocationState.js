import mongoose from 'mongoose';

const AllocationStateSchema = new mongoose.Schema({
  serviceType: { type: String, required: true, unique: true },
  currentIndex: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.models.AllocationState || mongoose.model('AllocationState', AllocationStateSchema);
