const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Define verifyToken
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Incoming auth header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No or bad auth header');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found in DB');
      return res.status(401).json({ error: 'Invalid token: user not found' });
    }

    req.user = { id: user._id, role: user.role };
    console.log('User verified:', req.user);
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Token verification failed' });
  }
};




// Define requireAdmin
const requireAdmin = (req, res, next) => {
  console.log('Checking admin role:', req.user?.role);
  if (req.user?.role !== 'admin') {
    console.log('Not an admin');
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

// ✅ Export them properly
module.exports = {
  verifyToken,
  requireAdmin,
  authenticateToken,
  requireAdminOrManager
};
