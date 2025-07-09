const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Define verifyToken
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    const user = await User.findById(decoded.id);
    if (!user) {
      
      return res.status(401).json({ error: 'Invalid token: user not found' });
    }

    req.user = { id: user._id, role: user.role };

    next();
  } catch (err) {
   
    return res.status(401).json({ error: 'Token verification failed' });
  }
};


// Define requireAdmin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
};

// Optional: Other middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdminOrManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ error: 'Access denied. Admin or manager role required.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  authenticateToken,
  requireAdminOrManager
};
