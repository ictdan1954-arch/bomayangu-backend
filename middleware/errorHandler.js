// middleware/errorHandler.js

// ---------- CUSTOM ERROR CLASS (optional) ----------
// You can use this to throw operational errors with specific status codes.
// e.g., throw new AppError('Invalid input', 400);
// class AppError extends Error {
//     constructor(message, statusCode) {
//         super(message);
//         this.statusCode = statusCode;
//         this.isOperational = true;
//     }
// }

// ---------- MAIN ERROR HANDLER ----------
module.exports = (err, req, res, next) => {
    // Log the error with stack trace
    console.error('❌ Error occurred:', {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Default status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // ---------- HANDLE SPECIFIC ERROR TYPES ----------

    // 1. Sequelize Validation Errors (e.g., missing fields, invalid data)
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ');
    }

    // 2. Sequelize Unique Constraint Errors (e.g., duplicate email)
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ');
    }

    // 3. JWT Errors (handled in auth middleware, but catch here just in case)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // 4. Database Connection Errors
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
        statusCode = 503;
        message = 'Database connection error';
    }

    // 5. Syntax Errors (e.g., malformed JSON in request body)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON payload';
    }

    // 6. Custom AppError (if you decide to use it)
    if (err.isOperational) {
        statusCode = err.statusCode || 500;
        message = err.message;
    }

    // ---------- RESPONSE ----------
    res.status(statusCode).json({
        success: false,
        error: message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
