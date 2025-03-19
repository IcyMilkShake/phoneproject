app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(200).json({ message: 'Username already exists!' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(200).json({ message: 'Email already exists!' });
        }

        const userId = await getNextSequenceValue('userId');
        
        // Set the default profile picture path
        const defaultProfilePicture = '/uploads/profile_pics/default-profile.png'; // Default image path
        
        const newUser = new User({
            userId,
            name,
            email,
            password,
            profilePicture: { path: defaultProfilePicture, contentType: 'image/png' }, // Default profile picture
        });

        await newUser.save(); // Save to the database
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// api/signup.js
import { connectDB, getNextSequenceValue } from '../server.js'; // Import connection and helper
import User from '../models/User'; // Import your User model

// Connect to the database before handling the API request
connectDB(); // This establishes the DB connection

// Define the API handler for signup
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { name, email, password } = req.body;

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
            const defaultProfilePicture = '../uploads/profile_pics/default-profile.png'; // Default image path
            
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
