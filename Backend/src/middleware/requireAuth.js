import { verifyAccessToken } from "../lib/tokens.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Authentication token missing",
      code: "UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    // Attach identity derived from the token — never from request body
    req.farmer = {
      userId: decoded.userId,
      farmerId: decoded.farmerId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid authentication token",
      code: "UNAUTHORIZED",
    });
  }
}