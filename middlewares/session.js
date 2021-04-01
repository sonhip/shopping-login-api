const mongoose = require('mongoose');
const Session = require('../models/Session');

module.exports = (req, res, next) => {
  if (!req.signedCookies.sessionId) {
    const sessionId = mongoose.Types.ObjectId();
    const newSession = new Session({
      _id: sessionId,
    });
    newSession.save();

    res.cookie('sessionId', sessionId, {
      maxAge: 60 * 60 * 1000 * 24,
      signed: true,
    });
  }

  next();
};
