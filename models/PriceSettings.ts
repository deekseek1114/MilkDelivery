import mongoose from 'mongoose';

const PriceSettingsSchema = new mongoose.Schema({
    effectiveDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    pricePerLiter: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

export default mongoose.models.PriceSettings || mongoose.model('PriceSettings', PriceSettingsSchema);
