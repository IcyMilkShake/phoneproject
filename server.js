const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./collection.js'); // Your User model
const Counter = require('./counter.js'); // Your Counter model
const Note = require('./note.js'); // Your Note model
const Setting = require('./settingschema.js'); // Your Note model
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const app = express();
const PORT = 8080;
const jwt = require('jsonwebtoken');

// Middleware to check if the token is valid
function authenticateToken(req, res, next) {
    // Get token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify the token with the secret key
    jwt.verify(token, 'angriestbird', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        // If token is valid, attach user info to the request
        req.user = user;
        next();  // Proceed to the next middleware or route handler
    });
}
const JWT_SECRET = 'angriestbird'

app.use(express.json());
app.use(cors({
    origin: '*',  // Or '*' to allow all origins (not recommended for production)
    credentials: true,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());  // Middleware to parse cookies

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/profile_pics'));
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cogcog9000@gmail.com',
        pass: 'bwun jaxk lgnn leal'
    }
});
// Connect to MongoDB
mongoose.connect('mongodb+srv://milkshake:t5975878@cluster0.k5dmweu.mongodb.net/API')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

    async function getNextSequenceValue(sequenceName) {
        const maxUserId = await User.find().sort({ userId: -1 }).limit(1).select('userId');
        let nextId = 1;
        if (maxUserId.length > 0) {
            nextId = maxUserId[0].userId + 1;
        }
        await Counter.findOneAndUpdate(
            { modelName: sequenceName },
            { seq: nextId },
            { upsert: true }
        );
        return nextId;
    }

    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

    app.post('/2fa-enable', async (req, res) => {
        const { bool } = req.body;
        const userId = req.user.userId;
    
        try {
            const existingSetting = await Setting.findOne({ userId: userId });
            
            if (bool) {
                // Generate the 2FA secret
                const secret = speakeasy.generateSecret();
                const otpauthUrl = speakeasy.otpauthURL({
                    secret: secret.base32,
                    label: `API:${req.user.name}`,
                    issuer: 'API'
                });
    
                const code = speakeasy.totp({ secret: 'MISD4ZJUGUUUEUBJPVIWGR3ENVQX2QJSHFUEU3JIOQWEC4R4NVEQ', encoding: 'base32' });
                console.log('Generated Code:', code);
                // Generate the QR code URL
                const qrcodeUrl = await qrcode.toDataURL(otpauthUrl);
                
                if (!existingSetting) {
                    // If no existing setting, create a new one
                    const newSetting = new Setting({
                        userId,
                        light: false,
                        midnight: false,
                        twofac: true,
                        twofaSecret: secret.base32,
                        twofaQRCode: qrcodeUrl // Save the QR code URL in the database
                    });
                    await newSetting.save();
                } else {
                    // If an existing setting exists, update it
                    existingSetting.twofac = true;
                    existingSetting.twofaSecret = secret.base32;
                    existingSetting.twofaQRCode = qrcodeUrl; // Save the QR code URL in the database
                    await existingSetting.save();
                }
    
                res.json({ qrcodeUrl }); // Send QR code URL to frontend
            } else {
                // If disabling 2FA
                if (existingSetting) {
                    existingSetting.twofac = false;
                    existingSetting.twofaSecret = null;
                    existingSetting.twofaQRCode = null;
                    await existingSetting.save();
                }
    
                res.status(200).json({ message: '2FA disabled' });
            }
        } catch (error) {
            console.error('Error enabling/disabling 2FA:', error);
            res.status(500).json({ message: 'Error updating 2FA', error: error.message });
        }
    });
    
    app.get('/check-2fa-status/:userId', async (req, res) => {
        try {
            const settings = await Setting.findOne({ userId: parseInt(req.params.userId) });
            res.json({ twoFactorEnabled: settings?.twofac || false });
        } catch (error) {
            console.error('Error checking 2FA status:', error);
            res.status(500).json({ message: 'Error checking 2FA status' });
        }
    });
app.get('/appearances', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }
    const userId = req.user.userId;
    const existingSetting = await Setting.findOne({ userId: userId });

    if (!existingSetting) {
        const newSetting = new Setting({
            userId,
            light: false,
            midnight: false
        });
        await newSetting.save();
    }

    const settings = await Setting.findOne({ userId: req.user.userId });
    res.json({ light: settings.light, midnight: settings.midnight });
});
app.post('/updappearance', async (req, res) => {
    const { light, midnight } = req.body;
    const userId = req.user.userId;

    try {
        const existingSetting = await Setting.findOne({ userId: userId });
        if (!existingSetting) {
            const newSetting = new Setting({
                userId,
                light: light,
                midnight: midnight
            });
            await newSetting.save();
        }

        const updLight = await Setting.findOneAndUpdate(
            { userId: userId },
            { light: light, midnight: midnight }
        );

        res.status(201).json({ message: 'Success', updated: updLight });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error updating', error: error.message });
    }
});
app.post('/send-email', (req, res) => {
    const { to, subject, message } = req.body;

    // Set up email options
    var mailOptions = {
        from: 'cogcog9000@gmail.com',
        to: to,
        subject: subject,
        html: message  // Using HTML body for the email content
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'Email sent successfully!' });
        }
    });
});
// API endpoint to fetch users
app.get('/users', async (req, res) => {
    try {
        if (!req.user) {
            return res.json({ message: 'Please Login First' });
        }

        const user = await User.findOne({ userId: req.user.userId });
        if (user) {
            res.json({ userId: user.userId, name: user.name });
        } else {
            res.json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/testing',async (req, res) => {
    return res.status(200).json(await User.find());
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
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

export default async (req, res) => {
    console.log('checkloggedin route hit');  // To check if the function is triggered

    if (req.method === 'GET') {
        if (req.user) {
            return res.status(200).json({ 
                message: 'You are already logged in. Redirecting to the main page...',
                redirectUrl: '/main.html',
            });
        } else {
            return res.status(200).json({ message: 'No jwt yet' });
        }
    } else {
        // Handle other methods (e.g., POST, PUT) if necessary
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
};


app.post('/login', async (req, res) => {
    const { name, password, email, token } = req.body;
    console.log(token)
    try {
        let user;

        // Check if the login is with email or username
        if (email) {
            user = await User.findOne({ email: name });
        } else {
            user = await User.findOne({ name: name });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }

        // Get user's 2FA settings
        const userSettings = await Setting.findOne({ userId: user.userId });
        console.log("hi")
        // If 2FA is enabled but no token provided, request 2FA
        if (userSettings?.twofac && !token) {
            return res.status(401).json({ 
                message: '2FA token required', 
                requires2FA: true,
                userId: user.userId,
                qrCodeUrl: userSettings.twofaQRCode // Send the QR code URL to the user
            });
        }

        // If 2FA is enabled and token is provided, verify it
        if (userSettings?.twofac && token) {
            console.log("yo")
            
            const code = speakeasy.totp({ secret: 'MISD4ZJUGUUUEUBJPVIWGR3ENVQX2QJSHFUEU3JIOQWEC4R4NVEQ', encoding: 'base32' });
            console.log('Generated Code:', code);
            const verified = speakeasy.totp.verify({
                secret: userSettings.twofaSecret,
                encoding: 'base32',
                token: token,
                window: 1, // Allow a wider time window, increase if needed
            });
            

            if (!verified) {
                return res.status(401).json({ 
                    message: 'Invalid 2FA token',
                    requires2FA: true,
                    userId: user.userId,
                    qrCodeUrl: userSettings.twofaQRCode // Send the QR code URL to the user
                });
            }
        }

        // If we get here, either 2FA is disabled or the token was valid
        const token = jwt.sign({ userId: user.userId, name: user.name }, 'angriestbird', { expiresIn: '1d' });
        res.status(200).json({ 
            message: 'Login successful!', 
            redirectUrl: '/main.html',
            userId: user.userId
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});





app.post('/check_resetpass', async (req, res) => {
    const { name, email } = req.body;
    try {
        console.log(name);
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(201).json({ message: 'No such username' });
        } else {
            if (user.email !== email) {
                return res.status(201).json({ message: 'Wrong email for this username' });
            } else if (user.email === email) {

                req.resetpass = name;
                return res.status(200).json({ message: 'Success' });
            }
        }
    } catch (error) {
        console.error('Error checking reset password:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.post('/reset_resetpass', async (req, res) => {
    const { password } = req.body;
    try {
        const session_user = req.resetpass;
        if (!session_user) {
            return res.status(400).json({ message: 'No jwt found, please check your reset password link' });
        }

        console.log(session_user);
        const user = await User.findOne({ "name": session_user });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the password
        user.password = password;
        console.log(password);
        await user.save();

        // Clear the session once the password is reset
        req.resetpass = null;

        res.status(200).json({ message: 'Password has been changed, returning to login page' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.post('/deleteaccount', async (req, res) => {
    const { password } = req.body;

    try {
        // Ensure session exists
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No session found' });
        }

        const session_user = req.user;
        console.log("Session User:", session_user);

        const user = await User.findOne({ name: session_user.name });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (password !== user.password) {
            return res.status(403).json({ message: 'Wrong pass blud' });
        }

        // Delete user from database
        await User.deleteOne({ userId: user.userId });

        // Delete all notes linked to the user
        await Note.deleteMany({ userId: user.userId });
        
        // Delete all settings linked to the user
        await Setting.deleteMany({ userId: user.userId });
        

// If you're using a cookie to store the JWT, you can delete it by setting an expired date
res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        return res.status(200).json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.get('/api/notes', async (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    Note.find({ userId: user.userId })
        .then(notes => res.json(notes))
        .catch(err => {
            console.error('Failed to fetch notes:', err);
            res.status(500).json({ message: 'Failed to fetch notes' });
        });
});



// Create a new note
app.post('/api/notes', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    const { content } = req.body;
    const userId = req.user.userId;

    const newNote = new Note({
        content,
        userId,
    });

    try {
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ message: 'Error saving note', error: error.message });
    }
});



// Update a note
app.put('/api/notes/:id', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('User not logged in');
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).send('Note content is required');
    }

    try {
        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!note) {
            return res.status(404).send('Note not found');
        }

        note.content = content;
        note.updatedAt = Date.now();
        await note.save();
        res.status(200).json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error updating note', error: error.message });
    }
});


app.delete('/api/notes/:id', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('User not logged in');
    }

    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!note) {
            return res.status(404).send('Note not found');
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Error deleting note', error: error.message });
    }
});

app.delete('/notes/mass-delete', async (req, res) => {
    try {
        const { noteIds } = req.body;
        
        // Verify user authentication 
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Delete notes owned by the current user
        const result = await Note.deleteMany({ 
            _id: { $in: noteIds },
            username: req.user.username 
        });

        res.json({
            message: 'Notes deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Mass delete error:', error);
        res.status(500).json({ message: 'Error deleting notes' });
    }
});



app.post('/logout', (req, res) => {
// If you're using a cookie to store the JWT, you can delete it by setting an expired date
res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/user/profile', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const userId = req.user.userId;
        const user = await User.findOne({ userId: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profilePicturePath = user.profilePicture?.path || '/uploads/profile_pics/default-profile.png';
        res.json({ name: user.name, userId: user.userId, profilePicture: profilePicturePath });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});


app.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const userId = req.user.userId;
        const imagePath = `/uploads/profile_pics/${req.file.filename}`;

        const result = await User.findOneAndUpdate(
            { userId: userId },
            { profilePicture: { path: imagePath, contentType: req.file.mimetype } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile picture uploaded successfully', profilePicture: result.profilePicture });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture' });
    }
});

app.post('/changeuser', async (req, res) => {
    try {
        const oldToken = req.cookies.token;  // Assuming JWT is stored in a cookie

        if (!oldToken) {
            return res.status(401).send('No token provided');
        }
    
        // Step 1: Decode the old JWT to access the current user info
        jwt.verify(oldToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send('Invalid or expired token');
            }
    
            // Step 2: Create the new payload with the updated 'user' field
            const updatedUser = { 
                ...decoded.user, // Copy existing user info
                newField: 'newValue' // Add new or modified fields
            };
    
            // Step 3: Create a new token with the updated user information
            const newToken = jwt.sign(
                { user: updatedUser },
                process.env.JWT_SECRET,
                { expiresIn: '1h' } // Or set your preferred expiration time
            );
    
            // Step 4: Send the new token back to the client (replace old one)
            res.cookie('token', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    
            return res.status(200).send('User updated successfully');
        });

        const { username } = req.body;
        const userId = req.user.userId;
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const existuser = await User.findOne({ name: username });
        if (!existuser) {
            user.name = username
            await user.save()
            const newuser = await User.findOne({ name: username });
            req.user = newuser; 
            return res.status(201).json({message: "Successfully Changed name"});
        }else{
            return res.status(201).json({message: "Username taken"});
        }
    } catch (error) {
        console.error('Error changing name:', error);
        res.status(500).json({ message: 'Error changing name', error: error.message });
    }
});
// Serve static files
app.use(express.static(path.join(__dirname)));