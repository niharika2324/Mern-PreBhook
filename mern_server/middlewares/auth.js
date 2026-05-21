import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 0,
        message: "Access token required. Please login."
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 0,
          message: "Invalid or expired token"
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({
      status: 0,
      message: "Authentication error",
      error: error.message
    });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 0,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }

    next();
  };
};
