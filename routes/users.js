const express = require("express");
const User = require("../models/User");
const Router = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// @route POST users
// @desc Register A New User
// @access Public
Router.post("/", async (req, res) => {
  try {
    const { userName, userEmail, userPassword, userPhone } = req.body;

    // Simple validation
    if (!userName || !userEmail || !userPassword || !userPhone) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (userExisting) {
      return res.status(400).json({ msg: "User already exists" });
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
              if (!req.signedCookies.token) {
                res.cookie("token", token, {
                  maxAge: 3600 * 24 * 1000,
                  signed: true,
                  httpOnly: true,
                  sameSite: "none",
                  secure: true,
                });
              }
              res.json({
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
Router.patch("/:id", upload.any(), async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    const likes = req.body.likes ? JSON.parse(req.body.likes) : null;
    const cart = req.body.cart ? JSON.parse(req.body.cart) : null;
    const orders = req.body.orders ? JSON.parse(req.body.orders) : null;
    const { userName, userEmail, userAddress, userPhone } = req.body;
    if (req.files[0]) {
      if (user.cloudinary_id && user.cloudinary_id !== "none") {
        await cloudinary.uploader.destroy(user.cloudinary_id);
      }
      await cloudinary.uploader
        .upload_stream(
          {
            upload_preset: "petshop_project",
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
Router.patch("/cart/add/:productId", async (req, res) => {
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
        { _id: userId, "cart.productId": productId },
        {
          $set: {
            "cart.$": {
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
// @desc Add To Cart User
// @access Public
Router.patch("/cart/add/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const { userId, quantity, product: currentProduct } = req.body;

    const currentUser = await User.findById(userId);
    const item = currentUser.cart.find((x) => {
      return x.productId.toString() === productId;
    });

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
        { _id: userId, "cart.productId": productId },
        {
          $set: {
            "cart.$": {
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

module.exports = Router;
