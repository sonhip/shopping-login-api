const express = require("express");
const Router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");

// @route POST auth
// @desc Auth user
// @access Public
Router.post("/", async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;

    // Simple validation
    if (!userEmail || !userPassword) {
      return res.status(400).json({ msg: "Vui lòng điền vào ô trống" });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (!userExisting) {
      return res.status(400).json({ msg: "Người dùng không tồn tại" });
    }
    const comparePassword = await bcrypt.compare(
      userPassword,
      userExisting.userPassword
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu không đúng" });
    }
    jwt.sign(
      { id: userExisting.id },
      process.env.JWT_SECRET,
      { expiresIn: 3600 * 24 },
      async (err, token) => {
        const updateUser = await User.findById(userExisting.id);
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
Router.get("/user", auth, (req, res) => {
  User.findById(req.user.id)
    .select("-userPassword")
    .then((user) => res.json(user));
});

// @route GET auth auth/clearCookie
// @desc Clear Cookie
// @access Private
Router.get("/clearCookie", (req, res) => {
  res
    .status(202)
    .clearCookie("token", { sameSite: "none", secure: true })
    .json({ msg: "Logout success" });
});

module.exports = Router;
