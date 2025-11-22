import mongoose from 'mongoose';

const MonthlyBillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String, // Format: "MM-YYYY"
        required: true,
    },
    totalLiters: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending',
    },
    dueDate: {
        type: Date,
    },
    paymentLink: {
        type: String,
    }
}, { timestamps: true });

// Ensure one bill per user per month
MonthlyBillSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.models.MonthlyBill || mongoose.model('MonthlyBill', MonthlyBillSchema);
