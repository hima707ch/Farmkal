const Product = require("../Models/product");
const ApiFeatures = require("../utils/ApiFeatures");
const CustomError = require("../utils/CustomError");
const uploadImageToCloudinary = require("../utils/uploadImage");
const cloudinary = require("cloudinary").v2;
const shuffleArray = require("../utils/ArrayFeatures");
const { citiesData } = require("../utils/data");

const createProduct = async (req, res, next) => {
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
      seller: req.user.id,
    };

    const product = await Product.create(productData);

    let images;
    let imageArray;

    if (req.files == true && req.files.image == true) {
      images = req.files.image;
      imageArray = Array.isArray(images) ? images : [images];
    }

    if (product) {
      if (imageArray) {
        imageArray.forEach(async (img) => {
          uploadImageToCloudinary(img, product, "Farmkal/Products", true);
        });
      }
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

const getAllProduct = async (req, res, next) => {
  try {
    req.query.sort = "-score";
    console.log(req.query);

    let apifeatures = new ApiFeatures(Product.find(), req.query, "product")
      .filter()
      .sort()
      .paginate();

    let products = await apifeatures.query;

    let count = products.length;
    let moreProducts;

    // search more product
    if (req.query.city && (count < 30 || req.query.sugg == "true")) {
      let nearByCity = [];

      req.query.city = req.query.city.toLowerCase();

      const myCity = citiesData.filter((ele) => {
        if (ele.city == req.query.city) {
          return true;
        }
      });

      if (myCity.length == 0) {
        res.status(200).json({
          success: true,
          products,
          message: "No suggestion, city not exist for suggestion",
        });
        return;
      }

      myLatitude = myCity[0].latitude;
      myLongitude = myCity[0].longitude;

      citiesData.map((ele) => {
        if (ele.city == myCity[0].city) return;
        if (
          ele.latitude < myLatitude + 1 &&
          ele.latitude > myLatitude - 1 &&
          ele.longitude < myLongitude + 1 &&
          ele.longitude > myLongitude - 1
        ) {
          nearByCity.push(ele.city);
        }
      });

      req.query.city = { $in: [...nearByCity] };

      apifeatures = new ApiFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .paginate();

      moreProducts = await apifeatures.query;
    }

    res.status(200).json({
      success: true,
      products,
      moreProducts,
    });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomError("No product", 400));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomError("No product found", 400));
    }

    const {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
      delete_public_id,
    } = req.body;

    const data = {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
    };

    product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!product) {
      return next(new CustomError("No product found", 400));
    }

    uploadImageToCloudinary(req.files.image, product, "Farmkal/Products", true);

    if (delete_public_id) {
      let is_deleted;

      product.images = product.images.filter((image) => {
        if (image.public_Id == delete_public_id) {
          is_deleted = true;
          return false;
        }
      });

      await product.save();

      if (is_deleted) {
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const resp = await Product.findByIdAndDelete(id);

    if (!resp) {
      return next(new CustomError("No product Found", 200));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
