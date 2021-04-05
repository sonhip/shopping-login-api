const express = require('express');
const Product = require('../models/Product');
const Router = express.Router();
const Session = require('../models/Session');

// @route GET session
// @desc Get data session
// @access Public
Router.get('/', async (req, res) => {
  try {
    const sessionId = req.signedCookies.sessionId;

    if (!sessionId) {
      return;
    }

    const sessionCurrent = await Session.findById(sessionId);
    await res.json(sessionCurrent);
  } catch (err) {
    console.log(err);
  }
});

// @route UPDATE cart
// @desc Add to cart
// @access Public
Router.patch('/add/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const sessionId = req.signedCookies.sessionId;
    const { quantity } = req.body;

    if (!sessionId) {
      return;
    }

    const currentSession = await Session.findById(sessionId);
    const item = currentSession.cart.find((x) => {
      return x.productId.toString() === productId;
    });

    const currentProduct = await Product.findById(productId);

    if (item && quantity === 0) {
      const updateSession = await Session.findOneAndUpdate(
        { _id: sessionId, 'cart.productId': productId },
        {
          $pull: {
            cart: {
              productId: productId,
            },
          },
        },
        { new: true }
      );
      await res.json(updateSession);
    } else if (item) {
      const updateSession = await Session.findOneAndUpdate(
        { _id: sessionId, 'cart.productId': productId },
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
      await res.json(updateSession);
    } else {
      const updateSession = await Session.findOneAndUpdate(
        { _id: sessionId },
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
      await res.json(updateSession);
    }
  } catch (err) {
    console.log(err);
  }
});

Router.get('/reset', async (req, res) => {
  try {
    const sessionId = req.signedCookies.sessionId;
    const resetCart = await Session.findByIdAndUpdate(
      sessionId,
      { cart: [] },
      { new: true }
    );
    await res.json(resetCart);
  } catch (err) {
    console.log(err);
  }
});

Router.get('/clearCookie', (req, res) => {
  res
    .status(202)
    .clearCookie('sessionId', {
      sameSite: 'none',
      secure: true,
    })
    .json({
      msg: 'cleared session',
    });
});

module.exports = Router;
