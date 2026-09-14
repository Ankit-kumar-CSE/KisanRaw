import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';


// Function to check the token
const jwtAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header missing" }); // ✅
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Token not found" });
        }
        // Verify the jwt token
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user information to the request object
        req.user = decode;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}


// Function to Generate token 
const generateToken = (userData) => {
    return jwt.sign({ username: userData }, process.env.JWT_SECRET,{expiresIn: '10d'}); // ✅ wrap in object
};

export { generateToken, jwtAuthMiddleware }; // Export the functions