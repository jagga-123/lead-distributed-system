import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  serviceType: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

// Ensure same phone number cannot create another lead for the same service
LeadSchema.index({ phoneNumber: 1, serviceType: 1 }, { unique: true });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
