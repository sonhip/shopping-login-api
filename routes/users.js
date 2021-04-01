const express = require('express');
const User = require('../models/User');
const Router = express.Router();
const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

// @route POST users
// @desc Register A New User
// @access Public
Router.post('/', async (req, res) => {
  try {
    const { userName, userEmail, userPassword, userPhone } = req.body;

    // Simple validation
    if (!userName || !userEmail || !userPassword || !userPhone) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (userExisting) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = new User({
      userName,
      userEmail,
      userPassword,
      userPhone,
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(userPassword, salt, (err, hash) => {
        newUser.userPassword = hash;
        newUser.save().then((user) => {
          jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            {
              expiresIn: 3600,
            },
            (err, token) => {
              res.json({
                token: token,
                user: {
                  _id: user.id,
                  userName: user.userName,
                  userEmail: user.userEmail,
                  imageUser: user.imageUser,
                  userAddress: user.userAddress,
                  userPhone: user.userPhone,
                  likes: user.likes,
                  orders: user.orders,
                  date: user.date,
                  cart: user.cart,
                },
              });
            }
          );
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH users
// @desc Update A User
// @access Private
Router.patch('/:id', upload.any(), async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    const likes = req.body.likes ? JSON.parse(req.body.likes) : null;
    const cart = req.body.cart ? JSON.parse(req.body.cart) : null;
    const orders = req.body.orders ? JSON.parse(req.body.orders) : null;
    const { userName, userEmail, userAddress, userPhone } = req.body;
    if (req.files[0]) {
      if (user.cloudinary_id && user.cloudinary_id !== 'none') {
        await cloudinary.uploader.destroy(user.cloudinary_id);
      }
      await cloudinary.uploader
        .upload_stream(
          {
            upload_preset: 'petshop_project',
          },
          async (err, imageUser) => {
            let infoUser = {
              userName,
              userEmail,
              userAddress,
              userPhone,
              imageUser: imageUser.secure_url,
              cloudinary_id: imageUser.public_id,
            };
            for (let prop in infoUser) {
              if (!infoUser[prop]) {
                delete infoUser[prop];
              }
            }
            const updateUser = await User.findByIdAndUpdate(
              req.params.id,
              infoUser,
              { new: true }
            );
            await res.json(updateUser);
          }
        )
        .end(req.files[0].buffer);
    } else {
      let infoUser = {
        userName,
        userEmail,
        userAddress,
        userPhone,
        orders,
        likes,
        cart,
      };
      for (let prop in infoUser) {
        if (!infoUser[prop]) {
          delete infoUser[prop];
        }
      }
      const updateUser = await User.findByIdAndUpdate(req.params.id, infoUser, {
        new: true,
      });
      await res.json(updateUser);
    }
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH users
// @desc Add To Cart User
// @access Public
Router.patch('/cart/add/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const { userId, quantity } = req.body;

    const currentUser = await User.findById(userId);
    const item = currentUser.cart.find((x) => {
      return x.productId.toString() === productId;
    });

    const currentProduct = await Product.findById(productId);

    if (item && quantity === 0) {
      const updateUser = await User.findOneAndUpdate(
        { _id: userId },
        {
          $pull: {
            cart: {
              productId: productId,
            },
          },
        },
        { new: true }
      );
      await res.json(updateUser);
    } else if (item) {
      const updateUser = await User.findOneAndUpdate(
        { _id: userId, 'cart.productId': productId },
        {
          $set: {
            'cart.$': {
              ...item,
              quantity: item.quantity + quantity,
            },
          },
        },
        { new: true }
      );
      await res.json(updateUser);
    } else {
      const updateUser = await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            cart: {
              name: currentProduct.name,
              imageProduct: currentProduct.imageProduct,
              price: currentProduct.price,
              productId: currentProduct._id.toString(),
              quantity: quantity,
            },
          },
        },
        { new: true }
      );
      await res.json(updateUser);
    }
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH users
// @desc Buy Again
// @access Private
Router.patch('/cart/buyAgain', async (req, res) => {
  try {
    const currentUser = await User.findById(req.body.userId);
    const currentOrder = await Order.findById(req.body.orderId);
    for (let i = 0; i < currentOrder.productsList.length; i++) {
      const item = currentUser.cart.find((x) => {
        return (
          x.productId.toString() === currentOrder.productsList[i].productId
        );
      });
      if (item) {
        await User.findOneAndUpdate(
          { _id: currentUser.id, 'cart.productId': item.productId },
          {
            $set: {
              'cart.$': {
                ...item,
                quantity:
                  item.quantity > currentOrder.productsList[i].quantity
                    ? item.quantity
                    : currentOrder.productsList[i].quantity,
              },
            },
          },
          { new: true }
        );
      } else {
        await User.findOneAndUpdate(
          { _id: currentUser.id },
          {
            $push: {
              cart: {
                ...currentOrder.productsList[i],
              },
            },
          },
          { new: true }
        );
      }
    }

    const updateUser = await User.findById(req.body.userId);
    res.json({
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
    });
  } catch (err) {
    console.log(err);
  }
});

//route PATCH users
// @desc Change Password
// @access Private
Router.patch('/changePw/:id', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    const comparePassword = await bcrypt.compare(
      oldPassword,
      user.userPassword
    );

    if (!comparePassword) {
      return res.status(400).json({ msg: 'Mật khẩu hiện tại không đúng' });
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newPassword, salt, async (err, hash) => {
        await User.findByIdAndUpdate(req.params.id, {
          userPassword: hash,
        });
        res.json('Change password success');
      });
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;
