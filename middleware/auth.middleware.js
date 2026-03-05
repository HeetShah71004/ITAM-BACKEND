import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc    Middleware to protect routes with JWT (verifyToken)
 */
export const verifyToken = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().startsWith("bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            if (!token) {
                console.error("Auth Middleware: Token part missing in Authorization header");
                return res.status(401).json({ message: "Unauthorized: Token missing" });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                console.error(`Auth Middleware: User not found for ID ${decoded.id}`);
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            if (!req.user.isActive) {
                console.error(`Auth Middleware: User ${req.user.email} is inactive`);
                return res.status(401).json({ message: "Not authorized, user account is inactive" });
            }

            return next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(403).json({ message: `Forbidden: ${error.message}` });
        }
    }

    if (!token) {
        console.error("Auth Middleware: No Authorization header or Bearer prefix");
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
};


/**
 * @desc    Middleware to restrict access to specific roles (authorizeRoles)
 * @param   {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions",
            });
        }
        next();
    };
};
