import mongoose from 'mongoose';

const trafficDataSchema = new mongoose.Schema({
  junctionId: { type: String, required: true },
  vehicleCount: { type: Number, required: true },
  queueLaneA: { type: Number, required: true },
  queueLaneB: { type: Number, required: true },
  congestionLevel: { type: String, enum: ['high', 'moderate', 'low'], default: 'moderate' },
  timestamp: { type: Date, default: Date.now }
});

// Index for faster time-series queries
trafficDataSchema.index({ junctionId: 1, timestamp: -1 });

export const TrafficData = mongoose.model('TrafficData', trafficDataSchema);
