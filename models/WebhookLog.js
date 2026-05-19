import mongoose from 'mongoose';

const WebhookLogSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.WebhookLog || mongoose.model('WebhookLog', WebhookLogSchema);
