import mongoose from 'mongoose';

const junctionSchema = new mongoose.Schema({
  junctionId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  algorithm: { type: String, enum: ['Proportional RL', 'Priority RL', 'Hybrid RL'], default: 'Proportional RL' },
  cycleDuration: { type: Number, default: 120 },
  baseLaneA: { type: Number, default: 20 },
  baseLaneB: { type: Number, default: 20 },
  status: { type: String, enum: ['critical', 'warning', 'normal'], default: 'normal' },
  createdAt: { type: Date, default: Date.now }
});

export const Junction = mongoose.model('Junction', junctionSchema);
