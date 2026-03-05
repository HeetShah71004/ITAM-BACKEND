import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc    Middleware to protect routes with JWT (verifyToken)
 */
export const verifyToken = async (req, res, next) => {
    let token;

    // Check Authorization header or x-auth-token
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (authHeader) {
        // Fallback for cases where "Bearer " prefix might be missing
        token = authHeader;
    } else if (req.headers["x-auth-token"]) {
        token = req.headers["x-auth-token"];
    }

    if (!token) {
        console.error("Auth Middleware: No token found. Headers were:", req.headers);
        return res.status(401).json({
            message: "Unauthorized: Token missing",
            debugInfo: "No Authorization header or x-auth-token found"
        });
    }

    try {
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
        return res.status(403).json({
            message: `Forbidden: ${error.message}`,
            tokenProvided: !!token
        });
    }
};


/**
 * @desc    Middleware to restrict access to specific roles (authorizeRoles)
 * @param   {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions",
            });
        }
        next();
    };
};
