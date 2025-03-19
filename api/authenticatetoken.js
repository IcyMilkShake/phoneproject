import jwt from 'jsonwebtoken';
import cookie from 'cookie'; // npm install cookie to parse cookies

const SECRET_KEY = "angriestbird";

// Refactor authenticateToken to use cookies
export const authenticateToken = async (req) => {
    const cookies = cookie.parse(req.headers.cookie || ''); // Parse cookies from the request
    const token = cookies.token; // Token should be stored in a cookie named 'token'
    
    if (!token) {
        throw new Error("Access denied. No token provided.");
    }

    try {
        // Use the promise-based approach for jwt.verify
        const user = await new Promise((resolve, reject) => {
            jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
                if (err) {
                    reject(new Error("Invalid token or token expired"));
                }
                resolve(decodedUser);  // Return decoded user data if the token is valid
            });
        });
        return user;  // Return the decoded user object
    } catch (error) {
        // If the token verification fails, throw an error
        throw new Error(`Token verification failed: ${error.message}`);
    }
};