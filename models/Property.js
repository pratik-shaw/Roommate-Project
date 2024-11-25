const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: { type: String, enum: ['Rent', 'Roommate'] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
});

module.exports = mongoose.model('Property', propertySchema);
