import express from "express";
const router = express.Router();
import { authenticateToken } from '../server.js';  // Import from the same server.js

router.get("/checkloggedin", authenticateToken, async (req, res) => {
    console.log("response hit");
    if (req.user) {
        return res.status(200).json({ 
            message: "You are already logged in. Redirecting to the main page...",
            redirectUrl: "/main.html" // The page you want to redirect to
        });
    } else {
        return res.status(401).json({ message: "Not logged in" });
    }
});

module.exports = router;
