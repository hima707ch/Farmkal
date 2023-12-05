const Product = require("../Models/product");
const ProductCity = require("../Models/productCity");
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

    if (city && category) {
      addProductToCity(city, product._id, category);
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

const addProductToCity = async (city, productID, category) => {
  try {
    const isCity = await ProductCity.findOne({ city: city });

    if (isCity) {
      const res = await isCity.updateOne({ $push: { [category]: productID } });
      console.log(res);
    } else {
      const res = await ProductCity.create({
        city: city,
        [category]: [productID],
      });
      console.log(res);
    }
  } catch (err) {
    console.log(err);
  }
};

const getAllProduct = async (req, res, next) => {
  try {
    req.query.sort = '-score';
    console.log(req.query);

    let apifeatures = new ApiFeatures(Product.find(), req.query)
      .filter()
      .sort()
      .paginate();

    let products = await apifeatures.query;

    let count = products.length;
    let moreProducts;

    if( req.query.city &&  (count < 30 || req.query.sugg == "true") ) {

      let nearByCity = [];

      const myCity = citiesData.filter( (ele)=>{
        if(ele.city == req.query.city){
          return true;
        }
      } );

      myLatitude = myCity[0].latitude;
      myLongitude = myCity[0].longitude;

      citiesData.map( (ele)=>{
        if(ele.city == myCity[0].city) return;
        if( (ele.latitude< myLatitude + 1 && ele.latitude > myLatitude - 1) &&
         (ele.longitude < myLongitude +1 && ele.longitude > myLongitude - 1) ){
          nearByCity.push(ele.city);
         }
      } );

      console.log(nearByCity);

      req.query.city = { $in : [...nearByCity] };

      apifeatures = new ApiFeatures(Product.find(), req.query)
      .filter()
      .sort()
      .paginate();

      moreProducts = await apifeatures.query;

    }

    res.status(200).json({
      success: true,
      products,
      moreProducts
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

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req,res,next) =>{
  try{
    const id = req.params.id;

    const resp = await Product.findByIdAndDelete(id);

    if(!resp){
        return next(new CustomError("No product Found", 200));
    }

    res.status(200).json({
        success : true,
        message : "Product deleted successfully"
    })
}
catch(err){
    next(err);
}
}

const addImage = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomError("No product found", 400));
    }

    uploadImageToCloudinary(req.files.image, product, "Farmkal/Products", true);

    res.status(200).json({
      success : true
    })

  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {

    let product = await Product.findById(req.params.id);

    const { publicId } = req.params;

    if (!publicId) {
      return next(new CustomError("No public Id"));
    }

    await cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Error deleting image:", error);
      } else {
        console.log("Image deleted successfully:", result);

        product.images = product.images.filter( (element)=>{
          if(element.public_Id == publicId){
            return false;
          }
          return true;
        } )

      }
    });
  } catch (err) {
    next(err);
  }
};

const getProductFromCity = async (req, res, next) => {

  // To do - rank according to score
  // If less prod fetch from other city

  try {
    const { city, category, page, limit } = req.body;
    // console.log("here")

    const queryOptions = {};

    if (page && limit) {
      queryOptions = {
        limit,
        skip: limit * (page - 1),
      };
    }

    const products = await ProductCity.findOne({ name: city })
      .populate({
        path: "solid vechiel", // wite all category here from category array;
        options: queryOptions,
      })
      .select("-_id -__v -name");

    if (!products) {
      return next("No product in city exist", 400);
    }


    let result = [];

    if (category) {
      result = products[category];
    } else {
      const values = Object.values(products.toObject());

      const temp = [];

      values.map((ele) => {
        temp.push(...ele);
        return;
      });

      result = shuffleArray(temp);
    }

    res.status(200).json({
      success: true,
      products: result,
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
  addImage,
  deleteImage,
  deleteProduct
};
