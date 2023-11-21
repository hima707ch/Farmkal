const Product = require("../Models/product");
const ProductCity = require("../Models/productCity");
const cloudinary = require("cloudinary").v2;

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const productData = {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
    };

    const product = await Product.create(productData);

    const images = req.files.image;
    const imageArray = Array.isArray(images) ? images : [images];

    if (product) {
      if (imageArray) {
        imageArray.forEach(async (img) => {
          console.log(img);

          await cloudinary.uploader
            .upload_stream(
              { folder: "Farmkal/Products", width: 150 },
              async (error, result) => {
                if (error) {
                  console.error("Error uploading image:", error);
                } else {
                  console.log("Image uploaded successfully:", result);

                  product.images.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                  });

                  const resp = await product.save();
                  console.log(resp);
                }
              },
            )
            .end(img.data);
        });
      }
    }

    if (city) {
      addProductToCity(product.city, product._id);
    }
  } catch (err) {
    console.log(err);
  }
};

const addProductToCity = async (city, productID) => {
  try {
    const isCity = await ProductCity.findOne({ [city]: { $exists: true } });

    if (isCity) {
      const res = await isCity.updateOne({ $push: { [city]: productID } });
      console.log(res);
    } else {
      const res = await ProductCity.create({
        [city]: [productID],
      });
      console.log(res);
    }
  } catch (err) {
    console.log(err);
  }
};

const getProductFromCity = async (req, res) => {
  try {
    const city = req.body.city;
    console.log(city);

    const products = await ProductCity.findOne({ [city]: { $exists: true } });

    console.log(products);

    const resultList = [];

    // products[city].forEach(async (prod) => {
    //   const product = await Product.findById(prod);
    //   //console.log(product);

    //   await resultList.push(product);
    // });



    for(const prod of products[city]){
      const product = await Product.findById(prod);
      //console.log(product);

      await resultList.push(product);
    }


    console.log(resultList);

    res.status(200).json({
      success: true,
      products: resultList,
    });
  } catch (err) {}
};

module.exports = { createProduct, addProductToCity, getProductFromCity };
