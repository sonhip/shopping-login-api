const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const OrderSchema = new Schema({
  productsList: {
    type: Array,
    required: true,
  },
  userAddress: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    default: '',
  },
  status: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Order = mongoose.model('Order', OrderSchema);
