import mongoose from 'mongoose';

const NotificationLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Email', 'SMS'],
        required: true,
    },
    category: {
        type: String,
        enum: ['Statement', 'Reminder', 'PaymentSuccess', 'PaymentFailure'],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Sent', 'Failed'],
        default: 'Sent',
    },
    sentAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

export default mongoose.models.NotificationLog || mongoose.model('NotificationLog', NotificationLogSchema);
