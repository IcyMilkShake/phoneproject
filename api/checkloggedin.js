// api/checkloggedin.js
import express from 'express';
import { authenticateToken } from '../api/authenticatetoken.js';  // Import authenticateToken from server.js

const router = express.Router();

router.get("/checkloggedin", authenticateToken, async (req, res) => {
    console.log("response hit");
    if (req.user) {
        return res.status(200).json({ 
            message: "You are already logged in. Redirecting to the main page...",
            redirectUrl: "/main.html"  // The page you want to redirect to
        });
    } else {
        return res.status(401).json({ message: "Not logged in" });
    }
});

export default router;  // Export as default
