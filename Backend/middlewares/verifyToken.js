import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (...allowedRoles) => {
  return (req, res, next) => {
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied. Unauthorized role." });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  };
};