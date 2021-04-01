const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  imageUser: {
    type: String,
    default:
      'https://res.cloudinary.com/nghiemduong2000/image/upload/v1606204579/Petshop%20Project/base/avatarDefault.png',
  },
  cloudinary_id: {
    type: String,
    default: 'none',
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPassword: {
    type: String,
    required: true,
  },
  userAddress: {
    type: String,
    default: '',
  },
  userPhone: {
    type: String,
    default: '',
  },
  orders: {
    type: Array,
    default: [],
  },
  likes: {
    type: Array,
    default: [],
  },
  cart: {
    type: Array,
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = User = mongoose.model('User', UserSchema);
