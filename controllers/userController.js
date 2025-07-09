const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('🔐 Signup request received:', { name, email: email ? '***' : 'missing' });
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Weak password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol.' });
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      signedInWithGoogle: false,
      emailVerified: false,
      role: 'customer'
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ token, role: user.role, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Login request received:', { email: email ? '***' : 'missing' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({
        token,
        role: user.role,
        name: user.name,
        email: user.email,
        userId: user._id
      });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
