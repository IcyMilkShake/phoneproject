// api/signup.js
import { getNextSequenceValue } from './getsequence.js';
import User from '../models/collection.js'; // Import your User model
import mongoose from 'mongoose';

const dbUri = 'mongodb+srv://milkshake:t5975878@cluster0.k5dmweu.mongodb.net/API'; // replace with your actual MongoDB URI

let isConnected = false; // Track if we're already connected to MongoDB

// Function to connect to MongoDB
export const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }

    try {
        await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process if we can't connect
    }
};

// Define the API handler for signup
export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'POST') {
        const { name, email, password } = req.body;

        // Ensure database connection before proceeding

        try {
            // Check if username already exists
            const existingUser = await User.findOne({ name });
            if (existingUser) {
                return res.status(200).json({ message: 'Username already exists!' });
            }

            // Check if email already exists
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(200).json({ message: 'Email already exists!' });
            }

            // Get the next sequence value for userId
            const userId = await getNextSequenceValue('userId');
            
            // Set the default profile picture path
            const defaultProfilePicture = '../uploads/profile_pics/default-profile.png'; // Default image path (adjust path as needed)
            
            // Create the new user
            const newUser = new User({
                userId,
                name,
                email,
                password,
                profilePicture: { path: defaultProfilePicture, contentType: 'image/png' }, // Default profile picture
            });

            // Save user to database
            await newUser.save();
            
            res.status(201).json({ message: 'User created successfully!' });

        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' }); // For other HTTP methods
    }
}
