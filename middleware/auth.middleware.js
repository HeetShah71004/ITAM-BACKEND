import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc    Middleware to protect routes with JWT (verifyToken)
 */
export const verifyToken = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            if (!req.user.isActive) {
                return res.status(401).json({ message: "Not authorized, user account is inactive" });
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
    }

    if (!token) {
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
