import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    light: { type: Boolean, required: true, default: false },
    midnight: { type: Boolean, required: true, default: false },
    twofac: { type: Boolean, default: false },
    twofaSecret: { type: String, default: '' }, // Secret for 2FA
    twofaQRCode: { type: String, default: '' } // Secret for 2FA
});


const Setting = mongoose.model('Setting', settingSchema);
export default Setting
