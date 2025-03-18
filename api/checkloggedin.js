
// api/checkloggedin.js
import { authenticateToken } from '../api/authenticatetoken';  // Import authenticateToken from server.js
export default async function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({ message: "API is working!" });
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
/*
export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Logic to check if the user is logged in
            const user = await authenticateToken(req); // Adjust this function if necessary
            if (user) {
                return res.status(200).json({ 
                    message: "You are already logged in. Redirecting to the main page...",
                    redirectUrl: "/main.html"
                });
            } else {
                return res.status(401).json({ message: "Not logged in" });
            }
        } catch (error) {
            console.error("Error in checkloggedin API:", error.message); // Log the error for debugging
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}
    */