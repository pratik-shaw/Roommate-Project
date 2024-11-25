const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// List all properties
router.get('/', async (req, res) => {
  const properties = await Property.find();
  res.render('dashboard', { properties });
});

// Property details
router.get('/:id', async (req, res) => {
  const property = await Property.findById(req.params.id);
  res.render('propertyDetails', { property });
});

module.exports = router;
