import mongoose from 'mongoose';

const PaymentRecordSchema = new mongoose.Schema({
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MonthlyBill',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending'],
        default: 'Pending',
    },
    method: {
        type: String, // e.g., 'UPI', 'Card', 'Cash'
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

export default mongoose.models.PaymentRecord || mongoose.model('PaymentRecord', PaymentRecordSchema);
