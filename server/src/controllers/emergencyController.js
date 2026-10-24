const EmergencyContact = require('../models/EmergencyContact');

const getContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: { contacts } });
  } catch (error) {
    next(error);
  }
};

const createContact = async (req, res, next) => {
  try {
    const { name, relationship = '', phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    const contact = await EmergencyContact.create({
      userId: req.user._id,
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
    });

    res.status(201).json({ success: true, data: { contact } });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found',
      });
    }

    res.status(200).json({ success: true, message: 'Emergency contact deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getContacts, createContact, deleteContact };
