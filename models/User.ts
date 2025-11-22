import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: 60,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    role: {
        type: String,
        enum: ['admin', 'company'],
        default: 'company',
    },
    companyDetails: {
        address: String,
        contactPerson: String,
        phone: String,
    },
    preferences: {
        defaultQuantity: {
            type: Number,
            default: 1, // Liters
        },
        skipDays: {
            type: [Number], // 0=Sunday, 1=Monday, etc.
            default: [0], // Default skip Sunday
        },
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
