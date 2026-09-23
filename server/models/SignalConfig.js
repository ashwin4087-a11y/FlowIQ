import mongoose from 'mongoose';

const signalConfigSchema = new mongoose.Schema({
  junctionId: { type: String, required: true },
  manualOverride: { type: Boolean, default: false },
  overrideLaneATime: { type: Number, default: 0 },
  overrideLaneBTime: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

export const SignalConfig = mongoose.model('SignalConfig', signalConfigSchema);
