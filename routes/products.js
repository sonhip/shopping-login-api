const express = require('express');
const Product = require('../models/Product');
const Router = express.Router();
const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');

// @route GET products
// @desc Get All Products
// @access Public
Router.get('/', (req, res) => {
  const { s, species, type } = req.query;

  const inputQuery = {
    name: s && new RegExp(s, 'i'),
    species,
    type,
  };

  for (let prop in inputQuery) {
    if (!inputQuery[prop]) {
      delete inputQuery[prop];
    }
  }

  Product.find({ ...inputQuery })
    .sort('-date')
    .then((products) => res.json(products));
});

// @route POST product
// @desc Create A New Product
// @access Private
Router.post('/', upload.any(), async (req, res) => {
  try {
    await cloudinary.uploader
      .upload_stream(
        {
          upload_preset: 'petshop_project',
        },
        (err, imageProduct) => {
          const { name, price, species, type, brand, description } = req.body;

          const newProduct = new Product({
            name,
            imageProduct: imageProduct.secure_url,
            cloudinary_id: imageProduct.public_id,
            species,
            price: parseInt(price),
            type,
            brand,
            description,
          });

          newProduct.save().then((product) => res.json(product));
        }
      )
      .end(req.files[0].buffer);
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH product
// @desc UPDATE A Product
// @access Private
Router.patch('/:id', upload.any(), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    const {
      name,
      price,
      species,
      type,
      brand,
      description,
      likes,
      reviews,
      promotion,
    } = req.body;
    if (req.files[0]) {
      await cloudinary.uploader.destroy(product.cloudinary_id);
      await cloudinary.uploader
        .upload_stream(
          {
            upload_preset: 'petshop_project',
          },
          async (err, imageProduct) => {
            let infoProduct = {
              name,
              imageProduct: imageProduct.secure_url,
              cloudinary_id: imageProduct.public_id,
              species,
              price: parseInt(price),
              type,
              brand,
              description,
            };

            for (let prop in infoProduct) {
              if (!infoProduct[prop]) {
                delete infoProduct[prop];
              }
            }

            const updateProduct = await Product.findByIdAndUpdate(
              req.params.id,
              infoProduct,
              { new: true }
            );
            await res.json(updateProduct);
          }
        )
        .end(req.files[0].buffer);
    } else {
      let infoProduct = {
        name,
        species,
        price: price ? parseInt(price) : undefined,
        type,
        brand,
        description,
        likes: likes ? parseInt(likes) : undefined,
        reviews: reviews ? JSON.parse(reviews) : undefined,
        promotion: promotion ? JSON.parse(promotion) : undefined,
      };

      for (let prop in infoProduct) {
        if (typeof infoProduct[prop] === 'undefined') {
          delete infoProduct[prop];
        }
      }

      const updateProduct = await Product.findByIdAndUpdate(
        req.params.id,
        infoProduct,
        { new: true }
      );
      await res.json(updateProduct);
    }
  } catch (err) {
    console.log(err);
  }
});

// @route DELETE product
// @desc DELETE A Product
// @access Private
Router.delete(`/:id`, async (req, res) => {
  try {
    // Find product by id
    const product = await Product.findById(req.params.id);
    // Delete image from cloudinary
    await cloudinary.uploader.destroy(product.cloudinary_id);
    // Delete product from db
    await product.deleteOne();
    await res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false });
  }
});

module.exports = Router;
