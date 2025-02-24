const express = require("express");
const router = express.Router();

router.get("/checkloggedin", async (req, res) => {
    console.log("response hit");
    if (req.session.user) {
        return res.status(200).json({ 
            message: "You are already logged in. Redirecting to the main page...",
            redirectUrl: "/main.html" // The page you want to redirect to
        });
    } else {
        return res.status(401).json({ message: "Not logged in" });
    }
});

module.exports = router;
