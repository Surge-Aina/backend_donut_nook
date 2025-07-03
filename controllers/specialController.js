const Special = require('../models/Special');

// Get all specials
const getAllSpecials = async (req, res) => {
  try {
    const specials = await Special.find();
    res.status(200).json(specials);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving specials', error: error.message });
  }
};

// Create a new special
const createSpecial = async (req, res) => {
  try {
    const { specialId, title, message, itemIds, startDate, endDate, createdBy } = req.body;
    
    const newSpecial = new Special({
      specialId,
      title,
      message,
      itemIds,
      startDate,
      endDate,
      createdBy
    });

    const savedSpecial = await newSpecial.save();
    res.status(201).json(savedSpecial);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.message });
    } else if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({ message: 'Validation error', error: 'Duplicate specialId' });
    } else if (error.name === 'CastError') {
      res.status(400).json({ message: 'Validation error', error: error.message });
    } else {
      res.status(500).json({ message: 'Error creating special', error: error.message });
    }
  }
};

// Update a special
const updateSpecial = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSpecial = await Special.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSpecial) {
      return res.status(404).json({ message: 'Special not found' });
    }

    res.status(200).json(updatedSpecial);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.message });
    } else if (error.code === 11000) {
      res.status(400).json({ message: 'Validation error', error: 'Duplicate specialId' });
    } else if (error.name === 'CastError') {
      res.status(400).json({ message: 'Validation error', error: error.message });
    } else {
      res.status(500).json({ message: 'Error updating special', error: error.message });
    }
  }
};

// Delete a special
const deleteSpecial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSpecial = await Special.findByIdAndDelete(id);

    if (!deletedSpecial) {
      return res.status(404).json({ message: 'Special not found' });
    }

    res.status(200).json({ message: 'Special deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting special', error: error.message });
  }
};

module.exports = { getAllSpecials, createSpecial, updateSpecial, deleteSpecial }; 