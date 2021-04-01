const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
  cart: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

SessionSchema.index({ createdAt: 1 }, { expires: 3600 * 24 });

module.exports = Session = mongoose.model('Session', SessionSchema);
