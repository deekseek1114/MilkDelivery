import mongoose from 'mongoose';

const MilkOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'not delivered', 'cancelled', 'skipped', 'Pending', 'Delivered', 'Not Delivered', 'Cancelled'],
        default: 'Pending',
    },
    pricePerUnit: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

// Compound index to ensure one order per user per day
MilkOrderSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.MilkOrder || mongoose.model('MilkOrder', MilkOrderSchema);
