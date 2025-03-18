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
        // Use a promise to handle JWT verification
        const user = await new Promise((resolve, reject) => {
            jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
                if (err) {
                    reject("Invalid token");
                }
                resolve(decodedUser);
            });
        });
        return user;
    } catch (error) {
        throw new Error(error);
    }
};
