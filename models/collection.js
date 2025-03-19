import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    userId: { type: Number, unique: true, required: true }, // Incrementing ID
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    profilePicture: {
        path: { type: String, default: '/uploads/profile_pics/default-profile.png' }, // Path to profile picture
        contentType: { type: String, default: 'image/png' } // Type of the image
    },
    twoFactorSecret: { type: String }, // Optional for users enabling 2FA
}, { timestamps: true }); // This adds createdAt and updatedAt fields automatically

const User = mongoose.model('User', userSchema);
export default User;
