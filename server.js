const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const User = require('./collection.js'); // Your User model
const Counter = require('./counter.js'); // Your Counter model
const Note = require('./note.js'); // Your Note model
const Setting = require('./settingschema.js'); // Your Note model
const nodemailer = require('nodemailer');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const sharp = require("sharp");
const fs = require("fs");

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());  // Middleware to parse cookies
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
  });
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Set up session middleware
app.use(session({
    secret: 'angriestbird',  // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Lax',
        maxAge: 24 * 60 * 60 * 1000  // Cookie expiration: 1 day
    }
}));    

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
    limits: { fileSize: 25 * 1024 * 1024 } // 5MB file size limit
});
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cogcog9000@gmail.com',
        pass: 'bwun jaxk lgnn leal'
    }
});
passport.serializeUser((user, done) => {
    // Just store the user ID or any unique identifier (e.g., Google ID)
    done(null, user.userId);  // Store userId or another unique identifier
});
passport.deserializeUser(async (userId, done) => {
    try {
        // Fetch the full user object using the ID you serialized (e.g., userId)
        const user = await User.findOne({ userId });  // Or whatever identifier you used
        done(null, user);  // Pass the user object to req.user
    } catch (err) {
        done(err);  // In case of error, pass the error to done
    }
});
// Connect to MongoDB
mongoose.connect('mongodb+srv://milkshake:t5975878@cluster0.k5dmweu.mongodb.net/API')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

    async function checkTagAvailability(name, tag) {
        try {
            // Find any user with the same name
            const existingUser = await User.findOne({ name });
    
            if (!existingUser) {
                // If no user with this name exists, return success
                return { success: true, message: "Tag is available." };
            }
    
            // If there is a user with the same name, check if the provided tag exists for them
            const userWithTag = await User.findOne({ name, tag });
    
            if (userWithTag) {
                // If a user with the same name already has the provided tag, return error
                return { success: false, error: "The tag is already taken by this user." };
            }
    
            // Otherwise, tag is available
            return { success: true, message: "Tag is available." };
        } catch (error) {
            console.error("Error checking tag availability:", error);
            return { success: false, error: "An error occurred while checking the tag." };
        }
    }

    const generateRandomTag = () => {
        return Math.floor(1000 + Math.random() * 9000).toString(); // generates a 4-digit number
    };
    async function getUniqueTag(name) {
        // Search for the user by name
        const user = await User.findOne({ name });
    
        // If user found, check the tag
        if (user) {
            let newTag = generateRandomTag();
            let tagExists = await User.findOne({ tag: newTag });
    
            // Check if tag exists, regenerate until it's unique
            while (tagExists) {
                newTag = generateRandomTag();
                tagExists = await User.findOne({ tag: newTag });
            }
    
            // Return the new unique tag
            return newTag;
        } else {
            return generateRandomTag();
        }
    }

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
    
    passport.use(new GoogleStrategy({
        clientID: "764440109211-519r5j9m6cfh1ovuiu0vujo0f2ufaldg.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: 'https://pat.ipo-servers.net/auth/google/callback',
    }, async (token, tokenSecret, profile, done) => {
        try {
            // Check if a user exists with the same email in the database
            let user = await User.findOne({ email: profile.emails[0].value });
    
            if (user) {
                // If user exists, link Google login to this user
                if (!user.google_id) {
                    // If user doesn't have a Google ID, link Google account
                    user.google_id = profile.id;
                    await user.save(); 
                }
                // Proceed with user login and pass user object
                return done(null, user)
            } else {
                const userId = await getNextSequenceValue('userId');
                const sequence = await getUniqueTag(profile.displayName);
                const profilePicturePath = profile.photos[0].value || '/uploads/profile_pics/default-profile.png';
                // If no user with this email exists, create a new user with Google info
                const removedSpace = profile.displayName.replace(/\s+/g, ''); // Fix here
                newUser = new User({
                    userId,
                    google_id: profile.id,      // Store Google ID
                    name: `${removedSpace}#${sequence}`,   // Override the name with Google name
                    displayName: removedSpace,
                    email: profile.emails[0].value, // Store email
                    profilePicture: {
                        path: profilePicturePath,      // Profile picture URL
                        contentType: 'image/png',      // Default content type
                    },
                    tag: sequence,
                });
                await newUser.save();
    
                // Proceed with new user login
                return done(null, newUser)
            }
        } catch (err) {
            console.error('Error during Google authentication:', err);
            return done(null, err)
        }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/google', (req, res, next) => {
        console.log('Starting Google authentication...');
        next();
    }, passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/' }),
        async (req, res) => {
            const user = await User.findOne({ email: req.user.email });
            const profilePicturePath = user.profilePicture.path;
            req.session.user = {
                userId: user.userId,               // Database userId
                name: user.name,
                displayName: user.displayName,         // Google display name
                email: user.email,              // Google email
                profilePicture: {
                    path: profilePicturePath,      // Profile picture URL
                    contentType: 'image/png',      // Default content type
                },
                google_id: user.google_id,           // Google user ID
                createdAt: user.createdAt,         // Database createdAt
                updatedAt: user.updatedAt,         // Database updatedAt
                tag: user.tag,
            };
            
            // Verify if session data is saved
            console.log("Session User:", req.session.user);

            // Redirect with token to frontend
            return res.redirect(`https://pat.ipo-servers.net/main.html`);
        }
    );
    
    app.post('/2fa-enable', async (req, res) => {
        const { bool } = req.body;
        const userId = req.session.user?.userId;
    
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    
        try {
            const existingSetting = await Setting.findOne({ userId });
    
            if (bool) {
                // Generate the 2FA secret
                const secret = speakeasy.generateSecret({ name: `API:${req.session.user.name}` });
                // Generate the QR code URL
                const qrcodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
                if (!existingSetting) {
                    // Create a new setting if none exists
                    await Setting.create({
                        userId,
                        light: false,
                        midnight: false,
                        twofac: true,
                        twofaSecret: secret.base32,
                        twofaQRCode: qrcodeUrl
                    });
                } else {
                    // Update existing setting
                    existingSetting.twofac = true;
                    existingSetting.twofaSecret = secret.base32;
                    
                    existingSetting.twofaQRCode = qrcodeUrl;
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

    app.post('/availableNum', async (req, res) => {
        try {
            const { name } = req.body
            const tag = await getUniqueTag(name)
            return res.status(200).json({ tag: tag });
        } catch (error) {
            console.error('Error checking 2FA status:', error);
            res.status(500).json({ message: 'Error checking 2FA status' });
        }
    });
app.get('/appearances', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }
    const userId = req.session.user.userId;
    const existingSetting = await Setting.findOne({ userId: userId });

    if (!existingSetting) {
        const newSetting = new Setting({
            userId,
            light: false,
            midnight: false
        });
        await newSetting.save();
    }

    const settings = await Setting.findOne({ userId: req.session.user.userId });
    res.json({ light: settings.light, midnight: settings.midnight, twofac: settings.twofac });
});
app.post('/updappearance', async (req, res) => {
    const { light, midnight } = req.body;
    const userId = req.session.user.userId;

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
        if (!req.session.user) {
            return res.json({ message: 'Please Login First' });
        }

        const user = await User.findOne({ userId: req.session.user.userId });
        if (user) {
            res.json({ userId: user.userId, name: user.name, displayName: user.displayName, tag: user.tag });
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
    const { name, email, password, tag } = req.body;
    try {
        // Check if name already exists (without # suffix)
        let baseName = name;
        let displayName = name
        // Get the next available sequence number
        const availability = await checkTagAvailability(displayName, tag)
        if (!availability.success) {
            return res.status(200).json({ message: 'Tag unavailable' });
        }
        // Append the sequence number (e.g., "username#1", "username#2", etc.)
        baseName = `${baseName}#${tag}`;

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            // Check if the user has a Google account linked and no password
            if (existingEmail.google_id && !existingEmail.password) {
                existingEmail.password = password
                await existingEmail.save(); // Save to the database
                console.log('User paired with google successfully!')
                return res.status(201).json({ message: 'User created successfully!' });
            } else {
                return res.status(200).json({ message: 'Email already exists!' });
            }
        }

        // Get a new user ID
        const userId = await getNextSequenceValue('userId');
        
        // Set the default profile picture path
        const defaultProfilePicture = '/uploads/profile_pics/default-profile.png'; // Default image path
        
        const newUser = new User({
            userId,
            name: baseName,  // Use the modified name with # suffix
            displayName: displayName,
            email,
            password,
            profilePicture: { path: defaultProfilePicture, contentType: 'image/png' }, // Default profile picture
            tag: tag,
        });

        await newUser.save(); // Save to the database
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});



app.get('/checkloggedin', async (req,res) => {
    if (req.session.user) {
        return res.status(200).json({ 
            message: 'You are already logged in. Redirecting to the main page...',
            redirectUrl: '/main.html' // The page you want to redirect to
        });
    }else{
        return res.status(200).json({ 
            message: 'Not logged in',
        });
    }
})

app.post('/login', async (req, res) => {
    const { name, password, email, token } = req.body;
    try {
        let user;
        // Check if the login is with email or username
        if (email) {
            user = await User.findOne({ email: name });
        } else {
            user = await User.findOne({ name: name });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }
        if (!user.password && user.google_id) {
            console.log("accoutn pair in signup pls")
            return res.status(401).json({ message: 'Account was already made with Google please pair your account by signing up again with this Email' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }
        // Get user's 2FA settings
        const userSettings = await Setting.findOne({ userId: user.userId });
        // If 2FA is enabled but no token provided, request 2FA
        if (userSettings?.twofac && !token) {
            return res.status(401).json({ 
                message: '2FA token required', 
                requires2FA: true,
                userId: user.userId,
            });
        }

        // If 2FA is enabled and token is provided, verify it
        if (userSettings?.twofac && token) {          
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
                });
            }
        }

        // If we get here, either 2FA is disabled or the token was valid
        req.session.user = user; // Set the user in the session
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
                // Store the username in the session for later use
                req.session.resetpass = name;
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
        const session_user = req.session.resetpass;
        if (!session_user) {
            return res.status(400).json({ message: 'No session found, please check your reset password link' });
        }

        console.log(session_user);
        const user = await User.findOne({ "name": session_user });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the password
        user.password = password;
        user.updatedAt = Date.now()
        await user.save();

        // Clear the session once the password is reset
        req.session.resetpass = null;

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
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized: No session found' });
        }

        const session_user = req.session.user;

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
        

        // Destroy session and clear cookies
        await new Promise((resolve) => req.session.destroy(resolve));
        res.clearCookie('connect.sid');

        return res.status(200).json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.get('/api/notes', async (req, res) => {
    const user = req.session.user;

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
    if (!req.session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    const { content } = req.body;
    const userId = req.session.user.userId;

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
    if (!req.session.user) {
        return res.status(401).send('User not logged in');
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).send('Note content is required');
    }

    try {
        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.session.user.userId
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
    if (!req.session.user) {
        return res.status(401).send('User not logged in');
    }

    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.user.userId
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
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

app.get('/user/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const userId = req.session.user.userId;
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
    console.log("Hi worl D")
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const userId = req.session.user.userId;
        const originalImagePath = req.file.path;

        // Read the image's dimensions
        const image = sharp(originalImagePath);
        const metadata = await image.metadata();

        // If the width is too large (e.g., greater than 1024px), resize it
        let resizedImagePath = originalImagePath;
        if (metadata.width > 1024) {
            resizedImagePath = path.join(__dirname, 'uploads/profile_pics', `resized-${req.file.filename}`);
            await image.resize(1024).toFile(resizedImagePath);
            console.log("resized")
            fs.unlinkSync(originalImagePath); // Delete the original file after resizing
        }

        const imagePath = `/uploads/profile_pics/${path.basename(resizedImagePath)}`;

        // Update user profile with the resized image path
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
        const { username } = req.body;
        const userId = req.session.user.userId;
        const user = await User.findOne({ userId: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.displayName == username) {
            return res.status(404).json({ message: 'Please choose a different name' });
        }
        const baseName = username; // Start with the base username

        // If someone already has this base name, check sequence availability
        const sequence = user.tag;

        // Append the sequence number (e.g., "username#1", "username#2", etc.)
        const newUsername = `${baseName}#${sequence}`;

        // Update the user's name with the new username
        user.name = newUsername;
        user.displayName = baseName;
        user.updatedAt = Date.now()
        await user.save();

        // Update session with the new username
        req.session.user.name = newUsername;
        req.session.user.displayName = baseName;
        return res.status(201).json({ message: `Username changed successfully to ${newUsername}` });
    } catch (error) {
        console.error('Error changing name:', error);
        res.status(500).json({ message: 'Error changing name', error: error.message });
    }
});
app.post('/changetag', async (req, res) => {
    try {
        const { tag } = req.body;
        const userId = req.session.user.userId;
        const user = await User.findOne({ userId: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.tag == tag) {
            return res.status(404).json({ message: 'Please choose a different tag' });
        }
        // If someone already has this base name, check sequence availability
        const checkTag = await checkTagAvailability(user.name, tag);
        if (!checkTag.success) {
            return res.status(200).json({ message: 'Tag unavailable' });
        }

        // Append the sequence number (e.g., "username#1", "username#2", etc.)
        const newUsername = `${user.displayName}#${tag}`;

        // Update the user's name with the new username
        user.name = newUsername;
        user.tag = tag;
        user.updatedAt = Date.now()
        await user.save();

        // Update session with the new username
        req.session.user.name = newUsername;
        req.session.user.tag = tag;
        return res.status(201).json({ message: `Tag changed successfully to ${tag}` });
    } catch (error) {
        console.error('Error changing name:', error);
        res.status(500).json({ message: 'Error changing name', error: error.message });
    }
});
// Serve static files
app.use(express.static(path.join(__dirname)));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
