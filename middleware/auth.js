const jwt = require('jsonwebtoken');

// ---------- CONFIGURATION ----------
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Check if JWT_SECRET is set
if (!JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET is not set in environment variables. Using a default (insecure) secret.');
    // In production, you should always set JWT_SECRET. This fallback is only for development.
    // process.env.JWT_SECRET = 'default-secret-change-me-in-production';
}

// ---------- GENERATE TOKEN ----------
exports.generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ---------- VERIFY TOKEN (Middleware) ----------
exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    // Extract token from 'Bearer <token>'
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        // Differentiate between token expiration and invalid token
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ---------- ADMIN ONLY (Middleware) ----------
exports.adminOnly = (req, res, next) => {
    // First, ensure that the user is authenticated (this middleware should be used after 'authenticate')
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

// ---------- OPTIONAL: REFRESH TOKEN (Utility) ----------
// If you want to implement token refresh, you can add a function here.
// For now, we keep it simple.
