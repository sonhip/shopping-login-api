const express = require('express');
const Order = require('../models/Order');
const Router = express.Router();

// @route GET orders
// @desc Get All orders
// @access Private
Router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort('-date');
    await res.json(orders);
  } catch (err) {
    console.log(err);
  }
});

// @route POST orders
// @desc Create A Order
// @access Public
Router.post('/', async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      userPhone,
      userAddress,
      status,
      productsList,
      paymentMethod,
    } = req.body;

    const newOrder = new Order({
      userName,
      userEmail,
      userPhone,
      userAddress,
      status,
      productsList,
      paymentMethod,
    });

    for (let prop in newOrder) {
      if (!newOrder[prop]) {
        delete newOrder[prop];
      }
    }

    const response = await newOrder.save();
    await res.json(response);
  } catch (err) {
    console.log(err);
  }
});

// @route PUT product
// @desc UPDATE Order
// @access Private
Router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const {
      userName,
      userEmail,
      userPhone,
      userAddress,
      status,
      productsList,
      paymentMethod,
    } = req.body;

    let updateOrder = {
      userName,
      userEmail,
      userPhone,
      userAddress,
      status,
      productsList,
      paymentMethod,
    };

    for (let prop in updateOrder) {
      if (!updateOrder[prop]) {
        delete updateOrder[prop];
      }
    }

    const response = await Order.findByIdAndUpdate(req.params.id, updateOrder, {
      new: true,
    });
    await res.json(response);
  } catch (err) {
    console.log(err);
  }
});

// @route DELETE order
// @desc DELETE Order
// @access Private
Router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    await order.deleteOne();
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = Router;
