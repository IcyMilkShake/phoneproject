const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./collection.js'); // Your User model
const Counter = require('./counter.js'); // Your Counter model
let currentUser = undefined

const app = express();
const PORT = 8080;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://milkshake:t5975878@cluster0.k5dmweu.mongodb.net/API')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));


    async function getNextSequenceValue(sequenceName) {
        // Find the highest customId currently in use
        const maxUserId = await User.find().sort({ userId: -1 }).limit(1).select('userId');
        
        let nextId = 1; // Default to 1 if no users exist
        if (maxUserId.length > 0) {
            nextId = maxUserId[0].userId + 1; // Increment the highest customId
        }
    
        // Update the counter
        await Counter.findOneAndUpdate(
            { modelName: sequenceName },
            { seq: nextId },
            { upsert: true }
        );
    
        return nextId; // Return the new ID
    }
// API endpoint to fetch users
app.get('/users', async (req, res) => {
    try {
        res.json(currentUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


// POST endpoint to create a new user
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
        const newUser = new User({
            userId,
            name,
            email,
            password,
        });

        await newUser.save(); // Save to the database
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await User.findOne({ name });
        const mail = await User.findOne({ email });
        if (!mail || !user || user.password !== password) {
            return res.status(201).json({ message: 'Invalid username, email or password.' });
        }

        // Successful login
        currentUser = user.name
        res.status(200).json({ message: 'Login successful!', user });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
