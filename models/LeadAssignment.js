import mongoose from 'mongoose';

const LeadAssignmentSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  providerId: { type: Number, required: true },
  serviceType: { type: String, required: true },
}, { timestamps: true });

// Same provider cannot receive the same lead twice
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

export default mongoose.models.LeadAssignment || mongoose.model('LeadAssignment', LeadAssignmentSchema);
