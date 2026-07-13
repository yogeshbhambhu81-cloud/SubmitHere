import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || process.env.SECRET;

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Must be in the form "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided", code: "NO_TOKEN" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Malformed authorization header", code: "NO_TOKEN" });
  }

  jwt.verify(token, SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please log in again.", code: "TOKEN_EXPIRED" });
      }
      // JsonWebTokenError, NotBeforeError, or any tampering attempt
      return res.status(403).json({ message: "Invalid token. Access denied.", code: "INVALID_TOKEN" });
    }

    req.user = decoded;
    next();
  });
}
