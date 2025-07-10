const About = require('../models/About');

// Get about content
exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne().sort({ updatedAt: -1 });
    if (!about) return res.status(404).json({ message: 'About content not found' });
    res.json(about);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve about content' });
  }
};

// Update about content (for admin)
exports.updateAbout = async (req, res) => {
  const { content } = req.body;

  try {
    const about = await About.findOneAndUpdate(
      {},
      {
        content,
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    res.json(about);
  } catch (err) {
    console.error('Update About error:', err);  // Add this line
    res.status(500).json({ error: 'Failed to update about content', details: err.message });
  }
};


// POST /about
exports.createAbout = async (req, res) => {
  try {
    const newAbout = await About.create({
      content: req.body.content,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });
    res.status(201).json(newAbout);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create new About document.' });
  }
};
