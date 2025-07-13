const About = require('../models/About');

// Get all sections
exports.getAllAbout = async (req, res) => {
  try {
    const aboutSections = await About.find().sort({ updatedAt: -1 });
    res.json(aboutSections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve about content' });
  }
};

// Create a new section
exports.createAbout = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newAbout = await About.create({
      title,
      content,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });
    res.status(201).json(newAbout);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create new About section.' });
  }
};

// Update a section
exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updated = await About.findByIdAndUpdate(
      id,
      {
        title,
        content,
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update about section' });
  }
};

// Delete a section
exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await About.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete about section' });
  }
};
