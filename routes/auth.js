const express = require('express');
const Router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const Session = require('../models/Session');

// @route POST auth
// @desc Auth user
// @access Public
Router.post('/', async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    const sessionId = req.signedCookies.sessionId;

    const currentSession = await Session.findById(sessionId);

    // Simple validation
    if (!userEmail || !userPassword) {
      return res.status(400).json({ msg: 'Vui lòng điền vào ô trống' });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (!userExisting) {
      return res.status(400).json({ msg: 'Người dùng không tồn tại' });
    }
    const comparePassword = await bcrypt.compare(
      userPassword,
      userExisting.userPassword
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: 'Mật khẩu không đúng' });
    }
    jwt.sign(
      { id: userExisting.id },
      process.env.JWT_SECRET,
      { expiresIn: 3600 * 24 },
      async (err, token) => {
        for (let i = 0; i < currentSession.cart.length; i++) {
          const item = userExisting.cart.find((x) => {
            return x.productId.toString() === currentSession.cart[i].productId;
          });
          if (item) {
            await User.findOneAndUpdate(
              { _id: userExisting.id, 'cart.productId': item.productId },
              {
                $set: {
                  'cart.$': {
                    ...item,
                    quantity:
                      item.quantity > currentSession.cart[i].quantity
                        ? item.quantity
                        : currentSession.cart[i].quantity,
                  },
                },
              },
              { new: true }
            );
          } else {
            await User.findOneAndUpdate(
              { _id: userExisting.id },
              {
                $push: {
                  cart: {
                    ...currentSession.cart[i],
                  },
                },
              },
              { new: true }
            );
          }
        }

        const updateUser = await User.findById(userExisting.id);
        await Session.findByIdAndUpdate(sessionId, { cart: [] });
        res.json({
          token,
          user: {
            _id: updateUser.id,
            userName: updateUser.userName,
            userEmail: updateUser.userEmail,
            imageUser: updateUser.imageUser,
            userAddress: updateUser.userAddress,
            userPhone: updateUser.userPhone,
            likes: updateUser.likes,
            orders: updateUser.orders,
            date: updateUser.date,
            cart: updateUser.cart,
          },
        });
      }
    );
  } catch (err) {
    console.log(err);
  }
});

// @route GET auth/user
// @desc Get User Data
// @access Private
Router.get('/user', auth, (req, res) => {
  User.findById(req.user.id)
    .select('-userPassword')
    .then((user) => res.json(user));
});

module.exports = Router;
