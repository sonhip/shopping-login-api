const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  imageProduct: {
    type: String,
    required: true,
  },
  cloudinary_id: {
    type: String,
  },
  species: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
  },
  description: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Array,
    default: [],
  },
  promotion: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Product = mongoose.model('Product', ProductSchema);
